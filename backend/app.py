from flask import Flask
from dotenv import load_dotenv
import os
load_dotenv()
from extensions import jwt,db,migrate
from routes.auth.routes import auth_bp
from routes.users.routes import users_bp
from routes.uploaded_file.routes import upload_bp
from datetime import timedelta
from flask_cors import CORS

app=Flask(__name__,static_folder="public")
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] =os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)

PUBLIC_FOLDER=os.path.join(app.root_path,"public","document")

app.config["PUBLIC_FOLDER"]=PUBLIC_FOLDER
app.config["MAX_CONTENT_LENGTH"]=5*1024*1024





db.init_app(app)
jwt.init_app(app)

migrate.init_app(app,db)

    

app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(upload_bp)    





if __name__=="__main__":
    app.run(debug=True)
