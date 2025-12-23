from flask import Blueprint,Flask,request,jsonify
from flask_jwt_extended import create_access_token
  
from werkzeug.security import generate_password_hash,check_password_hash

from extensions import db
from models import User

auth_bp=Blueprint("auth",__name__)


@auth_bp.route("/register/admin",methods=["POST"])
def Admin():
    if User.query.filter_by(role="admin").first():
        return jsonify({"ERROR":"Admin already existed"})
    
    data=request.json

    admin=User(
        name=data["name"],
        email=data["email"],
        password=generate_password_hash(data["password"]),
        address=data.get("address"),
        role="admin"
    )
    db.session.add(admin)
    db.session.commit()

    return jsonify({"message":"Admin Created Successfully"})


@auth_bp.route("/register",methods=["post"])
def CreateUser():
    data=request.json

    email=data.get("email")

    if not email:
        return jsonify({"message":"Email not mentioned"})
    
    if User.query.filter_by(email=email).first():
        return jsonify({"message":"user already existed"})

    hashedpassword=generate_password_hash(data.get("password"))
    print("hashed Password"+hashedpassword)



    user=User(
        name=data["name"],
        email=data["email"],
        password=hashedpassword,
        address=data["address"],
        role="user"
    )

    db.session.add(user)
    db.session.commit()
    return jsonify({"message":"user created successfully"})


@auth_bp.route("/login",methods=["POST"])

def login():
    data=request.json  
    email=data.get("email")
    password=data.get("password")
    if not email:
        return jsonify({"message":"enter valid email"})
    
    user=User.query.filter_by(email=email).first()
    


    if not user or not check_password_hash(user.password,password):
        return jsonify({"message":"Invalid credentials"}),401
    
    token=create_access_token(
        identity=str(user.id),
        additional_claims={"role":user.role,"name":user.name}
        )


    return jsonify({"message":"user login successfully","token":token}),200
