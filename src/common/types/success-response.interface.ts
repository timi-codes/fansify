import { HttpStatus } from '@nestjs/common';

export interface ISuccessResponse<T = any> {
  isSuccess: boolean;
  message: string;
  statusCode?: HttpStatus;
  data?: T;
  onChainSummary?: string
}

export function createSuccessResponse<T>(
  isSuccess: boolean,
  message: string,
  statusCode?: HttpStatus,
  data?: T,
  onChainSummary?: string
): ISuccessResponse<T> {
  return { isSuccess, message, data, statusCode, onChainSummary };
}
