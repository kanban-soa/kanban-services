import { Response } from "express";
import { HTTP_STATUS, ERROR_CODE_MAP, ERROR_CODES } from "../config/constants";
import { AppError } from "./AppError";

/**
 * Standard API Response Interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errorCode?: number;
  timestamp: string;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated Response
 */
export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination?: PaginationMeta;
}

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = HTTP_STATUS.OK
): Response {
  const response: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a created response
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = "Resource created successfully"
): Response {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

/**
 * Send a no content response
 */
export function sendNoContent(res: Response): Response {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}

/**
 * Send an error response with errorCode
 */
export function sendError(
  res: Response,
  errorCode: number,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message: string = "Error"
): Response {
  const response: ApiResponse = {
    success: false,
    statusCode,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a bad request error
 */
export function sendBadRequest(
  res: Response,
  errorCode: number,
  message: string = "Bad Request"
): Response {
  return sendError(res, errorCode, HTTP_STATUS.BAD_REQUEST, message);
}

/**
 * Send an unauthorized error
 */
export function sendUnauthorized(
  res: Response,
  errorCode: number = ERROR_CODES.UNAUTHORIZED,
  message: string = "Unauthorized"
): Response {
  return sendError(res, errorCode, HTTP_STATUS.UNAUTHORIZED, message);
}

/**
 * Send a forbidden error
 */
export function sendForbidden(
  res: Response,
  errorCode: number = ERROR_CODES.PERMISSION_DENIED,
  message: string = "Permission Denied"
): Response {
  return sendError(res, errorCode, HTTP_STATUS.FORBIDDEN, message);
}

/**
 * Send a not found error
 */
export function sendNotFound(
  res: Response,
  errorCode: number,
  message: string = "Not Found"
): Response {
  return sendError(res, errorCode, HTTP_STATUS.NOT_FOUND, message);
}

/**
 * Send a paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message: string = "Success",
  statusCode: number = HTTP_STATUS.OK
): Response {
  const response: PaginatedApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Handle an error caught in a controller.
 * - If AppError: resolve code via ERROR_CODE_MAP and send mapped HTTP status with errorCode.
 * - Otherwise: send generic 500 with no errorCode.
 */
export function handleControllerError(res: Response, error: unknown): Response {
  if (error instanceof AppError) {
    const entry = ERROR_CODE_MAP[error.code];
    if (entry) {
      return sendError(res, error.code, entry.httpStatus, "Error");
    }
  }

  // Unexpected / non-AppError
  const response: ApiResponse = {
    success: false,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Internal Server Error",
    timestamp: new Date().toISOString(),
  };
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
}
