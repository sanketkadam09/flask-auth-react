import os
from flask import send_from_directory
from flask_jwt_extended import get_jwt_identity
from models import UploadedFile
from extensions import db

from werkzeug.utils import secure_filename
from flask import Blueprint,current_app,request,jsonify
from flask_jwt_extended import jwt_required

# helper fucntion -> we can check file before saving otherwise somone can upload file which is not methiioned inallowed files

def allowed_file(filename):
    return '.'in filename and \
         filename.rsplit('.',1)[1].lower() in {'png','jpg','jpeg','pdf'}

upload_bp=Blueprint("uploaded_file",__name__)

@upload_bp.route("/upload",methods=["POST"])
@jwt_required()
def uploaded_file():
    user_id=get_jwt_identity();

    file= request.files["file"]
     
    if not file:
        return jsonify({"error":"NO file part"}),400
    
    if file.filename=='':
        return jsonify({"error":"No selected file"}),400
    if file and allowed_file(file.filename):
        filename=secure_filename(file.filename)

        file.save(os.path.join(current_app.config["PUBLIC_FOLDER"],filename))

        new_file=UploadedFile(
            filename=filename,
            user_id=user_id
        )
        db.session.add(new_file)
        db.session.commit()
        return jsonify({"message":"file Uploaded "}),201
         
        # return jsonify({
        #     "message":"file upload successfully",
        #     "file_url":f"http://127.0.0.1:5000/upload/{filename}"
        # }),201

    return jsonify({
        "error":"Invalid file type"
    }),400


@upload_bp.route("/upload/<filename>")

def get_uploaded_file(filename):
    return send_from_directory(current_app.config["PUBLIC_FOLDER"],filename)


    

# list of uploaeded document

@upload_bp.route("/files")
@jwt_required()
def list_files():
    user_id=get_jwt_identity()
    files=UploadedFile.query.filter_by(user_id=user_id).all()
    return jsonify([f.filename for f in files])
    
    # files=os.listdir(current_app.config["PUBLIC_FOLDER"])
    return jsonify(files)

@upload_bp.route("/files/<filename>",methods=["DELETE"])
@jwt_required()

def delete_file(filename):
    user_id=get_jwt_identity()

    file=UploadedFile.query.filter_by(
        filename=filename,
        user_id=user_id
    ).first()

    if not file:
        return jsonify({"error":"File not existed"})
    
    os.path.join(current_app.config["PUBLIC_FOLDER"],filename)
    db.session.delete(file)
    db.session.commit()
    return jsonify({"message":"deleted"})

