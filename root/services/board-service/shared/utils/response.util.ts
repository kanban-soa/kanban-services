import { Response } from 'express';

interface IResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  error?: any,
) => {
  const response: IResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    error,
  };
  res.status(statusCode).json(response);
};

export const success = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
) => {
  return sendResponse(res, statusCode, message, data);
};

export const failure = (
  res: Response,
  message: string,
  error?: any,
  statusCode = 500,
) => {
  return sendResponse(res, statusCode, message, undefined, error);
};