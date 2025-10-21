import { Request, Response, NextFunction } from "express";
import { AxiosError } from "axios";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError | AxiosError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error Handler:", err);

  // Default error
  let statusCode = 500;
  let message = "Internal server error";
  let details: any = undefined;

  // Handle AppError (custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Axios errors (API calls)
  else if ("isAxiosError" in err && err.isAxiosError) {
    const axiosError = err as AxiosError;
    statusCode = axiosError.response?.status || 502;
    message = "Failed to fetch data from MFL API";
    details = axiosError.response?.data;
  }

  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation error";
    details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }

  // Development vs Production error details
  const errorResponse: any = {
    success: false,
    message,
    ...(details && { details }),
  };

  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  // IMPORTANT: Send the response
  res.status(statusCode).json(errorResponse);
};
