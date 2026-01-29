from flask import Blueprint, current_app, request, jsonify,send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from models import UploadedFile, FileChunk
from extensions import db
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os


import re
import numpy as np
from google import genai


pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

client = genai.Client(api_key="AIzaSyB78ul6UCrodE5tgQ6zoh-5-8BBUhrouyc")
upload_bp = Blueprint("uploaded_file", __name__)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'pdf'}

def extract_basic_info(text):
    result = {}
    email = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    result["email"] = email.group(0) if email else None
    phone = re.search(r"\b[6-9]\d{9}\b", text)
    result["phone"] = phone.group(0) if phone else None
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    result["name"] = lines[0] if lines else None
    skills_list = ["python", "flask", "react", "node", "mongodb", "sql"]
    result["skills"] = [s for s in skills_list if s in text.lower()]
    return result

def chunk_text(text, chunk_size=40):
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

def get_embedding(text):
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    print(result)
    return np.array(result.embeddings[0].values)

# - UPLOAD ROUTE

@upload_bp.route("/upload", methods=["POST"])
@jwt_required()
def uploaded_file():
    user_id = get_jwt_identity()
    file = request.files.get("file")

    if not file or file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(current_app.config["PUBLIC_FOLDER"], filename)
    file.save(file_path)

    # ------------------ OCR Extraction ------------------
    ocr_text = {}
    if filename.lower().endswith(".pdf"):
        pages = convert_from_path(file_path, poppler_path=r"C:\poppler-25.12.0\Library\bin")
        for i, page in enumerate(pages, start=1):
            img = page.convert("L").resize((page.width * 2, page.height * 2))
            img = img.point(lambda x: 0 if x < 140 else 255, '1')
            text = pytesseract.image_to_string(img, lang='eng+mar', config="--psm 6")
            ocr_text[i] = text
    else:
        img = Image.open(file_path).convert("L")
        w, h = img.size
        img = img.resize((w * 3, h * 2))

        img = img.point(lambda x: 0 if x < 140 else 255, '1')
        text = pytesseract.image_to_string(img, lang='eng+mar', config="--psm 6")
        ocr_text[1] = text

    #  Extract basic info 
    extracted_info = {}
    for page, text in ocr_text.items():
        extracted_info[page] = extract_basic_info(text)

    # ------------------ Save UploadedFile first ------------------
    new_file = UploadedFile(
        filename=filename,
        user_id=user_id,
        ocr_text=ocr_text,
        extracted_info=extracted_info
    )
    db.session.add(new_file)
    db.session.commit()  

    # ------------------ Chunking + Embedding ------------------
    for page, text in ocr_text.items():
        chunks = chunk_text(text, chunk_size=40)
        for chunk_text_item in chunks:
            vec = get_embedding(chunk_text_item)
            new_chunk = FileChunk(
                file_id=new_file.id,
                page_number=page,
                chunk_text=chunk_text_item,
                embedding=vec,
                meta_info=extracted_info.get(page, {})
            )
            db.session.add(new_chunk)
    db.session.commit()

    return jsonify({
        "filename": filename,
        "user_id": user_id,
        "ocr_text": ocr_text,
        "extracted_info": extracted_info,
        "message": "File uploaded and embeddings stored successfully!"
    })


# ------------------ FILE ACCESS ------------------

@upload_bp.route("/upload/<filename>")
def get_uploaded_file(filename):
    return send_from_directory(
        current_app.config["PUBLIC_FOLDER"],
        filename
    )

@upload_bp.route("/files")
@jwt_required()
def list_files():
    user_id = get_jwt_identity()
    role = get_jwt()["role"]

    files = UploadedFile.query.all() if role == "admin" \
        else UploadedFile.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": f.id,
            "filename": f.filename,
            "user_id": f.user_id
        } for f in files
    ])

@upload_bp.route("/files/<filename>", methods=["DELETE"])
@jwt_required()
def delete_file(filename):
    user_id = get_jwt_identity()
    role = get_jwt()["role"]

    file = UploadedFile.query.filter_by(filename=filename).first() \
        if role == "admin" \
        else UploadedFile.query.filter_by(
            filename=filename,
            user_id=user_id
        ).first()

    if not file:
        return jsonify({"error": "File not existed"}), 404

    filepath = os.path.join(
        current_app.config["PUBLIC_FOLDER"],
        filename
    )

    if os.path.exists(filepath):
        os.remove(filepath)

    db.session.delete(file)
    db.session.commit()

    return jsonify({"message": "deleted"})

# search
@upload_bp.route("/search")
@jwt_required()
def search_files():
    query = request.args.get("q", "")
    if not query:
        return jsonify({"error": "No search query provided"}), 400

    user_id = get_jwt_identity()
    role = get_jwt()["role"]

    query_vec = get_embedding(query)
  
    chunks_query = FileChunk.query
    if role != "admin":
        chunks_query = chunks_query.join(UploadedFile).filter(UploadedFile.user_id == user_id)

    #  Order by cosine similarity in DB
    top_chunks = (
        chunks_query
        .order_by(FileChunk.embedding.op("<=>")(query_vec))

        .limit(5)  # return top 5 results
        .all()
    )

    if not top_chunks:
        return jsonify({"error": "No matching chunks found"}), 404
    
    results = []
    for chunk in top_chunks:
        results.append({
            "filename": chunk.uploaded_file.filename,
            "page_number": chunk.page_number,
            "matched_text": chunk.chunk_text,
            "meta_info": chunk.meta_info,
        })

    return jsonify(results)