import os
from functools import wraps

import click
from flask import Flask, jsonify, request, render_template
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from models import db, User

app = Flask(__name__)
app.url_map.strict_slashes = False
app.config['DEBUG']= True
app.config['ENV']= 'development'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS']= False
app.config['SQLALCHEMY_DATABASE_URI']= os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3')
app.config["JWT_SECRET_KEY"] = "super-secret"  

db.init_app(app)

migrate = Migrate (app,db)
bcrypt = Bcrypt(app)
CORS(app)
jwt = JWTManager(app)


def admin_required(view):
    @wraps(view)
    @jwt_required()
    def wrapped(*args, **kwargs):
        # Consultar la base de datos permite revocar permisos inmediatamente.
        user = User.query.filter_by(username=get_jwt_identity()).first()
        if user is None:
            return jsonify({"msg": "Usuario no encontrado"}), 401
        if user.role != 'admin':
            return jsonify({"msg": "Se requieren permisos de administrador"}), 403
        return view(*args, **kwargs)
    return wrapped


@app.cli.command('set-admin')
@click.argument('username')
def set_admin(username):
    """Asigna el rol de administrador a una cuenta existente desde el servidor."""
    user = User.query.filter_by(username=username).first()
    if user is None:
        raise click.ClickException('Usuario no encontrado. Registra primero la cuenta.')
    user.role = 'admin'
    db.session.commit()
    click.echo(f'{username} ahora es administrador.')


@app.route('/')
def main():
    return render_template('index.html')

@app.route('/login', methods =['POST'])
def login():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON request"}), 400

    username = request.json.get('username', None)
    password = request.json.get('password', None)

    if not username or username == '':
        return jsonify({"msg": "Missing username request"}), 400
    if not password or password == '':
        return jsonify({"msg": "Missing password request"}), 400

    # validar si el usuario ya existe
    user = User.query.filter_by(username = username).first()
    if not user:
        return jsonify({"msg": "username/password are incorrect"}), 401

    if bcrypt.check_password_hash(user.password, password):
        acces_token = create_access_token(identity=user.username)
        data = {
              "acces_token": acces_token,
              "user": user.serialize()
        }
        return jsonify(data), 200
    else:
        return jsonify({"msg": "username/password are incorrect"}), 401

# validar respuesta
@app.route('/register', methods =['POST'])
def register():

    if not request.is_json:
        return jsonify({"msg": "Missing JSON request"}), 400

    username = request.json.get('username', None)
    password = request.json.get('password', None)
    name = request.json.get('name', '')
    lastname = request.json.get('lastname', '')

    if not username or username == '':
        return jsonify({"msg": "Missing username request"}), 400
    if not password or password == '':
        return jsonify({"msg": "Missing password request"}), 400

    # validar si el usuario ya existe
    user = User.query.filter_by(username = username).first()
    if user:
        return jsonify({"msg": "username exist"}), 400

    # Crear Usuario
    user= User()
    user.username = username
    user.password = bcrypt.generate_password_hash(password)
    user.name = name
    user.lastname = lastname
    # El registro público nunca puede conceder permisos administrativos.
    user.role = 'user'

    db.session.add(user)
    db.session.commit()

    acces_token = create_access_token(identity=user.username)
    data = {
        "acces_token": acces_token,
        "user": user.serialize()
    }

    return jsonify(data), 201

@app.route('/change-password', methods =['POST'])
@jwt_required()
def changepassword():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON request"}), 400

    oldpassword = request.json.get('oldpassword', None)
    password = request.json.get('password', None)

    if not oldpassword or oldpassword == '':
        return jsonify({"msg": "Missing oldpassword request"}), 400
    if not password or password == '':
        return jsonify({"msg": "Missing password request"}), 400

    username = get_jwt_identity()

    user = User.query.filter_by(username = username).first()

    if user is None:
        return jsonify({"msg": "User not found"}), 404

    if not bcrypt.check_password_hash(user.password, oldpassword):
        return jsonify({"msg": "Old password is incorrect"}), 400

    user.password = bcrypt.generate_password_hash(password).decode('utf-8')

    db.session.commit()

    return jsonify({
        "msg": "Password has been changed successfully"
    }), 200


@app.route('/me', methods=['GET'])
@jwt_required()
def current_user():
    user = User.query.filter_by(username=get_jwt_identity()).first()
    if user is None:
        return jsonify({"msg": "Usuario no encontrado"}), 401
    return jsonify(user.serialize()), 200


@app.route('/users', methods=['GET'])
@admin_required
def users():
    return jsonify([user.serialize() for user in User.query.order_by(User.id).all()]), 200


@app.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404
    if user.username == get_jwt_identity():
        return jsonify({"msg": "No puedes eliminar tu propia cuenta de administrador"}), 400

    db.session.delete(user)
    db.session.commit()
    return '', 204


@app.route('/users/<int:user_id>/role', methods=['PATCH'])
@admin_required
def update_user_role(user_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or data.get('role') not in ('user', 'admin'):
        return jsonify({"msg": "El rol debe ser user o admin"}), 400

    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404
    if user.username == get_jwt_identity() and data['role'] != 'admin':
        return jsonify({"msg": "No puedes quitarte tu propio rol de administrador"}), 400

    user.role = data['role']
    db.session.commit()
    return jsonify(user.serialize()), 200



if __name__ == "__main__":
    app.run()
