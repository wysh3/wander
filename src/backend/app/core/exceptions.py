class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class NotFoundError(AppError):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            "NOT_FOUND",
            f"{resource} not found",
            404,
            {"resource": resource, "identifier": identifier},
        )


class VerificationError(AppError):
    def __init__(self, message: str):
        super().__init__("VERIFICATION_FAILED", message, 400)


class MatchingError(AppError):
    def __init__(self, message: str):
        super().__init__("MATCHING_FAILED", message, 500)


class AuthError(AppError):
    def __init__(self, message: str):
        super().__init__("AUTH_FAILED", message, 401)


class RateLimitError(AppError):
    def __init__(self):
        super().__init__("RATE_LIMITED", "Too many requests", 429)
