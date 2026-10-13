
import os

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PASSWORD = os.getenv("AUTHENTICHECK_DB_PASSWORD")
DB_HOST = os.getenv("MYSQLHOST")
DB_PORT = os.getenv("MYSQLPORT", "3306")
DB_NAME = os.getenv("MYSQLDATABASE")
DB_USER = os.getenv("MYSQLUSER")

if not all([DB_PASSWORD, DB_HOST, DB_NAME, DB_USER]):
    raise RuntimeError("Required database environment variables are missing.")

DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=int(DB_PORT),
    database=DB_NAME,
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()