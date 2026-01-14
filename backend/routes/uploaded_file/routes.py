import os
from flask import Blueprint, current_app, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from models import UploadedFile
from extensions import db
import json

import cv2
import numpy as np

# OCR imports
from PIL import Image
import pytesseract
from pdf2image import convert_from_path

# Set Tesseract path (Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

upload_bp = Blueprint("uploaded_file", __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'pdf'}

def is_blurry(pil_image, threshold=100):
    image = np.array(pil_image)

    # If image is already grayscale
    if len(image.shape) == 2:
        gray = image
    else:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance < threshold, variance



def low_contrast(pil_image, threshold=40):
    image = np.array(pil_image)

    if len(image.shape) == 2:
        gray = image
    else:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    contrast = gray.std()
    return contrast < threshold, contrast

 

def analyze_image_quality(pil_image):
    blurry, blur_score = is_blurry(pil_image)
    low_contrast_img, contrast_score = low_contrast(pil_image)

    warnings = []

    if blurry:
        warnings.append("Image is blurry")
    if low_contrast_img:
        warnings.append("Image has low contrast")

    quality = "good"
    if warnings:
        quality = "poor"

    return {
        "quality": quality,
        "warnings": warnings,
        "blur_score": round(blur_score, 2),
        "contrast_score": round(contrast_score, 2)
    }
 

def detect_stylized_text(pil_image):
    image = np.array(pil_image)

    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    else:
        gray = image

    _, thresh = cv2.threshold(gray, 0, 255,
                              cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    large_contours = [
        c for c in contours if cv2.contourArea(c) > 500
    ]

    return len(large_contours) > 10  # heuristic

import re

def extract_basic_info(text):
    """
    This function takes OCR text and extracts
    name, email, phone, and skills
    """

    result = {}

    # Email
    email = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    result["email"] = email.group(0) if email else None

    # Phone (10-digit Indian number)
    phone = re.search(r"\b[6-9]\d{9}\b", text)
    result["phone"] = phone.group(0) if phone else None

    # Name (first non-empty line)
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    result["name"] = lines[0] if lines else None

    # Skills (keyword match)
    skills_list = ["python", "flask", "react", "node", "mongodb", "sql"]
    result["skills"] = [s for s in skills_list if s in text.lower()]

    return result

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

    # ------------------- OCR PROCESS -------------------
    ocr_text = {}

    if filename.lower().endswith(".pdf"):
        pages = convert_from_path(file_path, poppler_path=r"C:\poppler-25.12.0\Library\bin")
        for i, page in enumerate(pages, start=1):
            img = page.convert("L").resize((page.width*2, page.height*2))
            img = img.point(lambda x: 0 if x < 140 else 255, '1')
            text = pytesseract.image_to_string(img, lang='eng+mar' ,config="--psm 6")
            ocr_text[i] = text
    else:
        img = Image.open(file_path)
        
        quality_report = analyze_image_quality(img)
        stylized = detect_stylized_text(img)
        if quality_report["quality"] == "poor" or stylized:
           os.remove(file_path)  # delete uploaded file
           return jsonify({
            "error": "Low quality image detected",
            "warnings": quality_report["warnings"],
            "reason":"Styled or cursive text detected",
            "message": "Please upload a clearer image for better OCR results and styled"
            }), 400
        img=img.convert("L")
        img = img.resize((img.width*3, img.height*2))
        img = img.point(lambda x: 0 if x < 140 else 255, '1')
        text = pytesseract.image_to_string(img,lang='eng+mar' ,config="--psm 6")
        ocr_text[1] = text
        
      
    # ------------------- BASIC INFO EXTRACTION -------------------
    extracted_info = {}
    for page, text in ocr_text.items():
        info = extract_basic_info(text)
        extracted_info[page] = info

    print("OCR Output:", ocr_text)

    print("Extracted Info:", extracted_info)

   

    # ------------------- SAVE TO DB -------------------
    new_file = UploadedFile(
        filename=filename,
        user_id=user_id,
        ocr_text=ocr_text,
        extracted_info=extracted_info
    )
    

    db.session.add(new_file)
    db.session.commit()

    return jsonify({
        "filename":filename,
        "user_id":user_id,
        "ocr_text":ocr_text,
        "extracted_info":extracted_info

    })




@upload_bp.route("/upload/<filename>")
def get_uploaded_file(filename):
    return send_from_directory(current_app.config["PUBLIC_FOLDER"],filename)


    

# list of uploaeded document

@upload_bp.route("/files")
@jwt_required()
def list_files():
    user_id = get_jwt_identity()
    role = get_jwt()["role"]

    if role == "admin":
        files = UploadedFile.query.all()
    else:
        files = UploadedFile.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": f.id,
            "filename": f.filename,
            "user_id": f.user_id
        } for f in files
    ])

    
    # files=os.listdir(current_app.config["PUBLIC_FOLDER"])
    # return jsonify(files)

@upload_bp.route("/files/<filename>",methods=["DELETE"])
@jwt_required()
def delete_file(filename):
    user_id=get_jwt_identity()
    role = get_jwt()["role"]
    if role =="admin":
        file=UploadedFile.query.filter_by(filename=filename).first()
    else:    
        file=UploadedFile.query.filter_by(
        filename=filename,
        user_id=user_id
    ).first()

    if not file:
        return jsonify({"error":"File not existed"})
    
    filepath= os.path.join(current_app.config["PUBLIC_FOLDER"],filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.session.delete(file)
    db.session.commit()
    return jsonify({"message":"deleted"})




@upload_bp.route("/search")
@jwt_required()
def search_files():
    query = request.args.get("q", "").lower()
    if not query:
        return jsonify({"error": "No search query provided"}), 400

    user_id = get_jwt_identity()
    role = get_jwt()["role"]

    # Step 1: Get files based on role
    if role == "admin":
        files = UploadedFile.query.all()
    else:
        files = UploadedFile.query.filter_by(user_id=user_id).all()

    results = []

    # Step 2: Loop through each file
    for f in files:
        ocr_text_data = f.ocr_text
        extracted_info_data = f.extracted_info

        # ---------- SAFETY FIXES ----------
        if isinstance(ocr_text_data, str):
            try:
                ocr_text_data = json.loads(ocr_text_data)
            except Exception:
                continue

        if isinstance(extracted_info_data, str):
            try:
                extracted_info_data = json.loads(extracted_info_data)
            except Exception:
                extracted_info_data = {}

        if not isinstance(ocr_text_data, dict):
            continue
        # ---------------------------------

        # Step 3: Loop through OCR pages
        for page, text in ocr_text_data.items():
            snippet = None

            # handle page key mismatch (int vs str)
            extracted = extracted_info_data.get(
                str(page),
                extracted_info_data.get(page, {})
            )

            # Step 4: Search text
            if text and query in text.lower():
                index = text.lower().find(query)
                start = max(0, index - 30)
                end = min(len(text), index + len(query) + 40)
                snippet = text[start:end].replace("\n", " ")

            # Step 5: Avoid duplicates
            if snippet:
                if not any(r["filename"] == f.filename and r["page"] == page for r in results):
                    results.append({
                        "filename": f.filename,
                        "page": page,
                        "matched_text": snippet,
                        "extracted_info": extracted
                    })

    return jsonify(results)
