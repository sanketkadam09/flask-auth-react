from flask import Blueprint, current_app, request, jsonify,send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from models import UploadedFile, FileChunk,OcrWord
from extensions import db
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os


import re
import numpy as np
from google import genai


pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

client = genai.Client(api_key="AIzaSyAksgghhM4dGy0Dd-XJUEIGSnPv-9l90_U")
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
    import uuid
    user_id = get_jwt_identity()
    file = request.files.get("file")

    if not file or file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    # ---------------- Save file ----------------
    filename = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(current_app.config["PUBLIC_FOLDER"], unique_name)
    file.save(file_path)

    ocr_text = {}
    ocr_words = []


    def process_image(img, page_no):
    
     orig_w, orig_h = img.size
     print(f"Processing image - Original size: {orig_w}x{orig_h}")  # Debug log

    
     img_gray = img.convert("L")
     img_bin = img_gray.point(lambda x: 0 if x < 140 else 255, "1")

    
     text = pytesseract.image_to_string(img_bin, lang="eng+mar", config="--psm 6")
     ocr_text[page_no] = text

   
     data = pytesseract.image_to_data(
         img_gray,  
          lang="eng+mar", 
         config="--psm 6", 
         output_type=pytesseract.Output.DICT
    )

     print(f"Found {len(data['text'])} text elements")  # Debug log

     for i in range(len(data["text"])):
         word_text = data["text"][i].strip()
         if not word_text:
            continue
        
        
         if len(ocr_words) == 0:
            print(f"First word: '{word_text}' at ({data['left'][i]}, {data['top'][i]}) "
                  f"size: {data['width'][i]}x{data['height'][i]}, orig: {orig_w}x{orig_h}")
        
         ocr_words.append({
            "page": page_no,
            "text": word_text,
            "x": int(data["left"][i]),
            "y": int(data["top"][i]),
            "w": int(data["width"][i]),
            "h": int(data["height"][i]),
            "scale_x": 1.0,
            "scale_y": 1.0,
            "conf": float(data["conf"][i]),
            "orig_width": orig_w,
            "orig_height": orig_h
        })

    # ---------------- Handle PDFs ----------------
    if unique_name.lower().endswith(".pdf"):
        from pdf2image import convert_from_path
        from PyPDF2 import PdfReader

        reader = PdfReader(file_path)
        for i, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text() or ""
            if page_text.strip():
                # Text-based PDF → store in FileChunks for embeddings
                ocr_text[i] = page_text
            else:
                # Scanned PDF → process via OCR AND save image
                pages_images = convert_from_path(
                    file_path, first_page=i, last_page=i,
                    poppler_path=r"C:\poppler-25.12.0\Library\bin"
                )
                page_image = pages_images[0]
                
                # **FIXED: Save the page as an image file**
                page_image_filename = f"{unique_name}_page_{i}.jpg"
                page_image_path = os.path.join(current_app.config["PUBLIC_FOLDER"], page_image_filename)
                page_image.save(page_image_path, "JPEG")
                
              
                process_image(page_image, i)
    else:
        # Handle regular images
        from PIL import Image
        img = Image.open(file_path)
        process_image(img, 1)

    
    extracted_info = {page: extract_basic_info(text) for page, text in ocr_text.items()}

    new_file = UploadedFile(
        filename=unique_name,
        user_id=user_id,
        ocr_text=ocr_text,
        extracted_info=extracted_info
    )
    db.session.add(new_file)
    db.session.commit()

    # Save OCR Words
    for word in ocr_words:
        db.session.add(OcrWord(
            file_id=new_file.id,
            page_number=word["page"],
            text=word["text"],
            x=word["x"],
            y=word["y"],
            w=word["w"],
            h=word["h"],
            scale_x=word["scale_x"],
            scale_y=word["scale_y"],
            confidence=word["conf"],
            orig_width=word["orig_width"],
            orig_height=word["orig_height"]
        ))
    db.session.commit()

    # Chunking + Embeddings 
    for page, text in ocr_text.items():
        for chunk in chunk_text(text, chunk_size=40):
            db.session.add(FileChunk(
                file_id=new_file.id,
                page_number=page,
                chunk_text=chunk,
                embedding=get_embedding(chunk),
                meta_info=extracted_info.get(page, {})
            ))
    db.session.commit()

    return jsonify({
        "file_id": new_file.id,
        "filename": unique_name,
        "ocr_text": ocr_text,
        "extracted_info": extracted_info,
        "message": "File uploaded, OCR words saved, text and embeddings stored successfully!"
    }), 201





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

    # Order by cosine similarity in DB
    top_chunks = (
        chunks_query
        .order_by(FileChunk.embedding.op("<=>")(query_vec))
        .limit(5)
        .all()
    )

    if not top_chunks:
        return jsonify({"error": "No matching chunks found"}), 404
    
    results = []
    for chunk in top_chunks:
        uploaded_file = chunk.uploaded_file
        filename = uploaded_file.filename
        
       
        is_image = filename.lower().endswith(('.png', '.jpg', '.jpeg'))
        
       
        if filename.lower().endswith('.pdf'):
            page_text = uploaded_file.ocr_text.get(str(chunk.page_number), "")
            is_scanned = page_text.strip() == ""
        else:
            
            is_scanned = True

        results.append({
            "filename": filename,
            "page_number": chunk.page_number,
            "matched_text": chunk.chunk_text,
            "meta_info": chunk.meta_info,
            "is_scanned": is_scanned,
            "file_id": uploaded_file.id
        })

    return jsonify(results)

@upload_bp.route("/ocr_words")
@jwt_required()
def get_ocr_words():
    file_id = request.args.get("file_id")
    page = int(request.args.get("page_number", 1))

    words = OcrWord.query.filter_by(file_id=file_id, page_number=page).all()
    return jsonify([{
        "text": w.text,
        "x": w.x,
        "y": w.y,
        "w": w.w,
        "h": w.h,
        "scale_x":w.scale_x,
        "scale_y":w.scale_y,
        "orig_width": w.orig_width,    
        "orig_height": w.orig_height,
        "confidence":w.confidence
    } for w in words])