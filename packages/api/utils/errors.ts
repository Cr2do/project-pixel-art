export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request') {
    super(400, message);
  }
}

export class SchemaValidationError extends HttpError {
  public readonly errors: { field: string; message: string }[];

  constructor(zodError: { issues: { path: PropertyKey[]; message: string }[] }) {
    super(400, 'Données invalides');
    this.name = 'SchemaValidationError';
    this.errors = zodError.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.map(String).join('.') : '_root',
      message: issue.message,
    }));
  }
}
