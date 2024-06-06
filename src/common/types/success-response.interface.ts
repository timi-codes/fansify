import { HttpStatus } from '@nestjs/common';

export interface ISuccessResponse<T = any> {
  isSuccess: boolean;
  message: string;
  statusCode?: HttpStatus;
  data?: T;
}

export function createSuccessResponse<T>(
  isSuccess: boolean,
  message: string,
  statusCode?: HttpStatus,
  data?: T,
): ISuccessResponse<T> {
  return { isSuccess, message, data, statusCode };
}
