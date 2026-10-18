"""Authorization tests against an isolated in-memory database."""
import os
import unittest
from pathlib import Path
from unittest.mock import patch

from flask_migrate import downgrade, upgrade
from sqlalchemy import inspect, text

with patch.dict(os.environ, {'DATABASE_URL': 'sqlite:///:memory:'}):
    from app import app, bcrypt
    from models import db, User


class RoleTests(unittest.TestCase):
    def setUp(self):
        self.context = app.app_context()
        self.context.push()
        db.create_all()
        self.client = app.test_client()
        self.admin = self.register('administrator')
        self.member = self.register('member')
        User.query.filter_by(username='administrator').first().role = 'admin'
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def register(self, username, **extra):
        response = self.client.post('/register', json={
            'username': username, 'password': 'test-password',
            'name': 'Test', 'lastname': 'Account', **extra,
        })
        self.assertEqual(response.status_code, 201)
        return response.get_json()

    def headers(self, account):
        return {'Authorization': f"Bearer {account['acces_token']}"}

    def change_role(self, actor, target, role):
        return self.client.patch(f"/users/{target['user']['id']}/role",
                                 headers=self.headers(actor), json={'role': role})

    def test_registration_ignores_requested_admin_role(self):
        account = self.register('attempted-admin', role='admin')
        self.assertEqual(account['user']['role'], 'user')
        self.assertEqual(User.query.filter_by(username='attempted-admin').first().role, 'user')

    def test_login_and_me_return_current_role(self):
        login = self.client.post('/login', json={
            'username': 'administrator', 'password': 'test-password',
        })
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json['user']['role'], 'admin')
        self.assertEqual(self.client.get('/me', headers=self.headers(self.admin)).json['role'], 'admin')

    def test_anonymous_cannot_list_or_assign_roles(self):
        self.assertEqual(self.client.get('/users').status_code, 401)
        self.assertEqual(self.client.patch('/users/1/role', json={'role': 'admin'}).status_code, 401)

    def test_user_cannot_list_or_assign_roles(self):
        self.assertEqual(self.client.get('/users', headers=self.headers(self.member)).status_code, 403)
        self.assertEqual(self.change_role(self.member, self.member, 'admin').status_code, 403)
        self.assertEqual(self.change_role(self.member, self.admin, 'user').status_code, 403)

    def test_admin_can_list_without_exposing_passwords(self):
        response = self.client.get('/users', headers=self.headers(self.admin))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json), 2)
        self.assertTrue(all('password' not in account for account in response.json))

    def test_promotion_and_revocation_apply_to_existing_tokens(self):
        self.assertEqual(self.change_role(self.admin, self.member, 'admin').status_code, 200)
        self.assertEqual(self.client.get('/users', headers=self.headers(self.member)).status_code, 200)
        self.assertEqual(self.change_role(self.admin, self.member, 'user').status_code, 200)
        self.assertEqual(self.client.get('/users', headers=self.headers(self.member)).status_code, 403)
        self.assertEqual(self.change_role(self.member, self.member, 'admin').status_code, 403)
        self.assertEqual(self.client.get('/me', headers=self.headers(self.member)).json['role'], 'user')

    def test_invalid_role_payloads_do_not_change_account(self):
        for payload in ({}, {'role': 'owner'}, {'role': None}, {'role': []}, [], 'admin'):
            with self.subTest(payload=payload):
                response = self.client.patch(f"/users/{self.member['user']['id']}/role",
                                             headers=self.headers(self.admin), json=payload)
                self.assertEqual(response.status_code, 400)
        response = self.client.patch(f"/users/{self.member['user']['id']}/role",
                                     headers=self.headers(self.admin), data='invalid')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(db.session.get(User, self.member['user']['id']).role, 'user')

    def test_missing_account_returns_not_found(self):
        response = self.client.patch('/users/99999/role', headers=self.headers(self.admin), json={'role': 'admin'})
        self.assertEqual(response.status_code, 404)

    def test_admin_cannot_demote_self(self):
        self.assertEqual(self.change_role(self.admin, self.admin, 'user').status_code, 400)
        self.assertEqual(db.session.get(User, self.admin['user']['id']).role, 'admin')

    def test_deleted_admin_token_loses_access(self):
        db.session.delete(db.session.get(User, self.admin['user']['id']))
        db.session.commit()
        self.assertEqual(self.client.get('/users', headers=self.headers(self.admin)).status_code, 401)
        self.assertEqual(self.client.get('/me', headers=self.headers(self.admin)).status_code, 401)

    def test_admin_can_delete_user_and_old_session_loses_access(self):
        response = self.client.delete(f"/users/{self.member['user']['id']}", headers=self.headers(self.admin))
        self.assertEqual(response.status_code, 204)
        self.assertIsNone(db.session.get(User, self.member['user']['id']))
        self.assertEqual(self.client.get('/me', headers=self.headers(self.member)).status_code, 401)
        self.assertEqual(self.client.post('/login', json={
            'username': 'member', 'password': 'test-password',
        }).status_code, 401)
        self.assertEqual(len(self.client.get('/users', headers=self.headers(self.admin)).json), 1)

    def test_anonymous_and_user_cannot_delete_accounts(self):
        target = f"/users/{self.admin['user']['id']}"
        self.assertEqual(self.client.delete(target).status_code, 401)
        self.assertEqual(self.client.delete(target, headers=self.headers(self.member)).status_code, 403)
        self.assertEqual(self.client.delete(f"/users/{self.member['user']['id']}",
                                          headers=self.headers(self.member)).status_code, 403)
        self.assertEqual(User.query.count(), 2)

    def test_admin_cannot_delete_self(self):
        response = self.client.delete(f"/users/{self.admin['user']['id']}", headers=self.headers(self.admin))
        self.assertEqual(response.status_code, 400)
        self.assertIsNotNone(db.session.get(User, self.admin['user']['id']))

    def test_deleting_missing_account_returns_not_found(self):
        self.assertEqual(self.client.delete('/users/99999', headers=self.headers(self.admin)).status_code, 404)

    def test_admin_can_delete_another_admin(self):
        self.change_role(self.admin, self.member, 'admin')
        self.assertEqual(self.client.delete(f"/users/{self.member['user']['id']}",
                                            headers=self.headers(self.admin)).status_code, 204)
        self.assertEqual(self.client.get('/users', headers=self.headers(self.member)).status_code, 401)

    def test_local_command_promotes_existing_account(self):
        result = app.test_cli_runner().invoke(args=['set-admin', 'member'])
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertEqual(db.session.get(User, self.member['user']['id']).role, 'admin')
        result = app.test_cli_runner().invoke(args=['set-admin', 'missing'])
        self.assertNotEqual(result.exit_code, 0)

    def test_password_change_still_works(self):
        response = self.client.post('/change-password', headers=self.headers(self.member), json={
            'oldpassword': 'test-password', 'password': 'new-password',
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(bcrypt.check_password_hash(db.session.get(User, self.member['user']['id']).password, 'new-password'))


class MigrationTests(unittest.TestCase):
    def test_migration_preserves_existing_account_and_supports_downgrade(self):
        with app.app_context():
            directory = str(Path(__file__).parent / 'migrations')
            try:
                upgrade(directory=directory, revision='b227ccd6ea8b')
                db.session.execute(text("INSERT INTO users (username, password, name, lastname) VALUES ('existing', 'hash', 'Test', 'Account')"))
                db.session.commit()
                upgrade(directory=directory)
                account = User.query.filter_by(username='existing').one()
                self.assertEqual(account.role, 'user')
                self.assertEqual(account.password, 'hash')
                db.session.remove()
                downgrade(directory=directory, revision='b227ccd6ea8b')
                self.assertNotIn('role', [column['name'] for column in inspect(db.engine).get_columns('users')])
                self.assertEqual(db.session.execute(text('SELECT count(*) FROM users')).scalar(), 1)
                db.session.remove()
                upgrade(directory=directory)
                self.assertEqual(User.query.one().role, 'user')
            finally:
                db.session.remove()
                db.drop_all()
                with db.engine.begin() as connection:
                    connection.execute(text('DROP TABLE IF EXISTS alembic_version'))


if __name__ == '__main__':
    unittest.main()
