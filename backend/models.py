from extensions import db

class User(db.Model):
    __tablename__="users"

    id=db.Column(db.Integer,primary_key=True)
    name=db.Column(db.String(50),nullable=False)
    email=db.Column(db.String(50),unique=True,nullable=False)
    password=db.Column(db.String(200),nullable=False)
    address=db.Column(db.String(200),nullable=True)
    role=db.Column(db.String(20),default="user")
    phone_no=db.Column(db.String(15),unique=True,nullable=True)