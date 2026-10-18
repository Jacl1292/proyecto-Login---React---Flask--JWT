"""Add user roles, assigning existing accounts the user role.

Revision ID: c8d2a164be90
Revises: b227ccd6ea8b
"""
from alembic import op
import sqlalchemy as sa


revision = 'c8d2a164be90'
down_revision = 'b227ccd6ea8b'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('role', sa.String(20), nullable=False, server_default='user'))
        batch_op.create_check_constraint('ck_users_role', "role IN ('user', 'admin')")


def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('ck_users_role', type_='check')
        batch_op.drop_column('role')
