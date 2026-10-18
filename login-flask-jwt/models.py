from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column (db.Integer, primary_key = True)
    username = db.Column (db.String(100), unique=True, nullable = False)
    password = db.Column (db.String(100), nullable = False)
    name = db.Column (db.String(100), nullable = False)
    lastname = db.Column (db.String(100), nullable = False)
    role = db.Column(db.String(20), nullable=False, default='user', server_default='user')

    __table_args__ = (
        db.CheckConstraint("role IN ('user', 'admin')", name='ck_users_role'),
    )

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "lastname": self.lastname,
            "role": self.role,
        }
