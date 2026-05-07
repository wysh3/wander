from pydantic import BaseModel
from typing import Generic, TypeVar

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    cursor: str | None = None
    next_cursor: str | None = None


class ErrorResponse(BaseModel):
    error: dict
