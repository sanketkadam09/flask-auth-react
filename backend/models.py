from extensions import db
from sqlalchemy.dialects.postgresql import JSON

from sqlalchemy.dialects.postgresql import JSON
# from sqlalchemy.dialects.postgresql import ARRAY
# from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from pgvector.sqlalchemy import Vector


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

    ocr_text = db.Column(JSON, nullable=True)
    extracted_info = db.Column(db.JSON, nullable=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    chunks = db.relationship(
        "FileChunk",
        backref="uploaded_file",
        cascade="all, delete-orphan"
    )
    ocr_words=db.relationship(
        "OcrWord",
        backref="uploaded_file",
        cascade="all,delete-orphan"
    )




class FileChunk(db.Model):
    __tablename__ = "file_chunks"

    id = db.Column(db.Integer, primary_key=True)
    file_id = db.Column(
        db.Integer,
        db.ForeignKey("uploaded_files.id"),
        nullable=False
    )
    page_number = db.Column(db.Integer, nullable=False)
    chunk_text = db.Column(db.Text, nullable=False)
    embedding = db.Column(Vector(3072), nullable=False) #embedding size
    meta_info = db.Column(JSON, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # uploaded_file = db.relationship("UploadedFile", backref="chunks")


class OcrWord(db.Model):
    __tablename__ = "ocr_words"

    id = db.Column(db.Integer, primary_key=True)

    file_id = db.Column(
        db.Integer,
        db.ForeignKey("uploaded_files.id", ondelete="CASCADE"),
        nullable=False
    )

    page_number = db.Column(db.Integer, nullable=False)
    text = db.Column(db.String(100), nullable=False)

    
    x = db.Column(db.Integer, nullable=False)
    y = db.Column(db.Integer, nullable=False)
    w = db.Column(db.Integer, nullable=False)
    h = db.Column(db.Integer, nullable=False)

    scale_x = db.Column(db.Float, nullable=False)
    scale_y = db.Column(db.Float, nullable=False)

    orig_width = db.Column(db.Integer, nullable=False)   
    orig_height = db.Column(db.Integer, nullable=False)

    confidence = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # uploaded_file = db.relationship("UploadedFile", backref="ocr_words")
