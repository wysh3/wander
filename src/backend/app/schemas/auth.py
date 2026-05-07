from pydantic import BaseModel, Field


class SendOTPRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+91\d{10}$")


class SendOTPResponse(BaseModel):
    expires_in: int = 300


class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+91\d{10}$")
    otp: str = Field(..., pattern=r"^\d{6}$")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    user: dict
