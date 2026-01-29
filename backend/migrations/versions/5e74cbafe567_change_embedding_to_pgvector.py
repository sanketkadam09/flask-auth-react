"""Change embedding to pgvector

Revision ID: 5e74cbafe567
Revises: 97f42c104f87
Create Date: 2026-01-20 15:25:07.157623
"""

from alembic import op

revision = '5e74cbafe567'
down_revision = '97f42c104f87'
branch_labels = None
depends_on = None


def upgrade():
    # ensure pgvector extension exists
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # convert double precision[] → vector(1536)
    op.execute("""
        ALTER TABLE file_chunks
        ALTER COLUMN embedding
        TYPE vector(3072)
        USING embedding::vector
    """)


def downgrade():
    op.execute("""
        ALTER TABLE file_chunks
        ALTER COLUMN embedding
        TYPE double precision[]
        USING embedding
    """)
