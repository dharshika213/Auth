from pydantic import BaseModel, EmailStr, Field, field_validator


def validate_gmail_address(value: EmailStr) -> EmailStr:
    email = str(value).strip()
    if not email.lower().endswith("@gmail.com"):
        raise ValueError("Only @gmail.com email addresses are allowed.")
    return value


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(pattern="^(student|teacher)$")

    @field_validator("email")
    @classmethod
    def email_must_be_gmail(cls, value: EmailStr) -> EmailStr:
        return validate_gmail_address(value)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def email_must_be_gmail(cls, value: EmailStr) -> EmailStr:
        return validate_gmail_address(value)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    model_config = {
        "from_attributes": True,
    }


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse