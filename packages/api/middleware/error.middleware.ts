import { Request, Response, NextFunction } from 'express';
import { HttpError, SchemaValidationError } from '../utils/errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof SchemaValidationError) {
    res.status(err.statusCode).json({ message: err.message, errors: err.errors });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  res.status(500).json({ message: 'Erreur interne du serveur' });
}
