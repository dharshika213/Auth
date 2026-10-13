from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.user import User
from app.routes.analysis import router as analysis_router
from app.routes.assignments import router as assignment_router
from app.routes.auth import router as auth_router
from app.routes.submissions import router as submission_router
from app.security import get_current_user


app = FastAPI(
    title="AuthentiCheck API",
    description="AI-Based Academic Work Verification System",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(assignment_router)
app.include_router(submission_router)
app.include_router(analysis_router)


@app.get("/")
def root():
    return {
        "message": "AuthentiCheck API is running",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }


@app.get("/api/auth/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }
