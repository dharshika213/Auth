import os

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker


DB_PASSWORD = os.getenv("AUTHENTICHECK_DB_PASSWORD")

if not DB_PASSWORD:
    raise RuntimeError(
        "AUTHENTICHECK_DB_PASSWORD environment variable is not set."
    )


DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username="root",
    password=DB_PASSWORD,
    host="localhost",
    port=3306,
    database="authentichek",
)


engine = create_engine(
    DATABASE_URL,
    echo=True,
)


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