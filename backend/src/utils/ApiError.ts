/**
 * An error that is safe to show to the client. Anything thrown that is NOT an
 * ApiError is treated as unexpected and reported as a generic 500.
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message = "Bad request", errors?: Record<string, string>) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message);
  }

  static forbidden(message = "You do not have permission to do that") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message: string, errors?: Record<string, string>) {
    return new ApiError(409, message, errors);
  }
}
