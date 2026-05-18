import { ERROR_CODE_MAP, type ErrorCode } from "../config/constants";

/**
 * Custom error class that carries a numeric error code.
 * Services throw AppError(ERROR_CODES.XXX); controllers resolve the code
 * to determine the HTTP response. The message is for internal logging only.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;

  constructor(code: ErrorCode) {
    const entry = ERROR_CODE_MAP[code];
    super(entry?.message ?? `Unknown error code: ${code}`);
    this.name = "AppError";
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
