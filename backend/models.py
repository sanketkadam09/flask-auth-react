from extensions import db
from sqlalchemy.dialects.postgresql import JSON

class User(db.Model):
    __tablename__="users"

    id=db.Column(db.Integer,primary_key=True)
    name=db.Column(db.String(50),nullable=False)
    email=db.Column(db.String(50),unique=True,nullable=False)
    password=db.Column(db.String(200),nullable=False)
    address=db.Column(db.String(200),nullable=True)
    role=db.Column(db.String(20),default="user")
    phone_no=db.Column(db.String(15),unique=True,nullable=True)
    
    files = db.relationship("UploadedFile", backref="user", lazy=True)

class UploadedFile(db.Model):
    __tablename__ = "uploaded_files"

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    # file_url = db.Column(db.String(255), nullable=False)
    # public_id = db.Column(db.String(255), nullable=False)
    ocr_text=db.Column(JSON,nullable=True)
    extracted_info = db.Column(db.JSON, nullable=True)


    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(db.DateTime, server_default=db.func.now())
