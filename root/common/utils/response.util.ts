import { Response } from "express";
import { HTTP_STATUS } from "../config/constants";

/**
 * Standard API Response Interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
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
 * Send an error response
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message: string = "Error"
): Response {
  const response: ApiResponse = {
    success: false,
    statusCode,
    message,
    error,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a bad request error
 */
export function sendBadRequest(
  res: Response,
  error: string,
  message: string = "Bad Request"
): Response {
  return sendError(res, error, HTTP_STATUS.BAD_REQUEST, message);
}

/**
 * Send an unauthorized error
 */
export function sendUnauthorized(
  res: Response,
  error: string = "Unauthorized",
  message: string = "Unauthorized"
): Response {
  return sendError(res, error, HTTP_STATUS.UNAUTHORIZED, message);
}

/**
 * Send a forbidden error
 */
export function sendForbidden(
  res: Response,
  error: string = "Forbidden",
  message: string = "Permission Denied"
): Response {
  return sendError(res, error, HTTP_STATUS.FORBIDDEN, message);
}

/**
 * Send a not found error
 */
export function sendNotFound(
  res: Response,
  error: string,
  message: string = "Not Found"
): Response {
  return sendError(res, error, HTTP_STATUS.NOT_FOUND, message);
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
