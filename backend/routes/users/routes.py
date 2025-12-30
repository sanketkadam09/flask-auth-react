from flask import Blueprint,request,jsonify
from flask_jwt_extended import jwt_required,get_jwt_identity,get_jwt
from extensions import db
from models import User

users_bp=Blueprint("users",__name__)



@users_bp.route("/users",methods=["GET"])
@jwt_required()
def getUsers():
    user_id=int(get_jwt_identity())
    user= User.query.get(user_id)
    if not user:
        return jsonify({"Error":"User not Existed please logged in"})
    
    page=int(request.args.get("page",1))
    limit=int(request.args.get("limit",5))
    search=request.args.get("search","")


    offset=(page-1)*limit
    query=User.query
    if search:
        query=query.filter(
            User.name.ilike(f"%{search}%")|
            User.role.ilike(f"%{search}%")|
            User.address.ilike(f"%{search}%")
         )

    users=query.offset(offset).limit(limit).all()
    total_users=query.count()

    return jsonify({
        "page":page,
        "limit":limit,
        "total_users":total_users,
        "total_pages":(total_users+limit-1)//limit,
        "users": [{
          "id":u.id,
          "name":u.name,
          "email":u.email,
          "address":u.address,
          "role":u.role
    }for u in users]})
 

@users_bp.route("/users/<int:id>",methods=["GET"])
@jwt_required()
def getSingleUser(id):
    user=User.query.get(id)
    if user:
       return jsonify({
        "id":user.id,
        "name":user.name,
        "email":user.email,
        "address":user.address,
        "role":user.role

    })

    return jsonify({"message":"user not existed"})


@users_bp.route("/users/<int:id>",methods=["PUT"])
@jwt_required()
def updateUser(id):
    data=request.json
    user_id=int(get_jwt_identity())
    user=User.query.get(id)

    if not user:
        return jsonify({"message":"user not existed"})
    
    if get_jwt()["role"]!="admin" and user_id!=id :
        return jsonify({"error":"unauthorized token"})
    

    if  "name" in data:
        user.name=data.get("name")
    if "email"in data:
        user.email=data.get("email")    
    if "address" in data:
        user.address=data.get("address")    

    
    db.session.commit()
    

    return jsonify({"message":"user updated successfully"})


@users_bp.route("/users/<int:id>",methods=["DELETE"])
@jwt_required()
def deleteUser(id):
    user_id=int(get_jwt_identity())
    user=User.query.get(id)

    if not user:
        return jsonify({"error":"user not existed"})

    if get_jwt()["role"]=="admin":
        if  user_id==id:
            return jsonify({"error":"admin not deleted self"})
        
    else:
        if user_id!=id:
            return jsonify({"error":"unauthorized user"})    
    
    db.session.delete(user)
    db.session.commit()

    return jsonify({"message":"user deleted successfully"})

