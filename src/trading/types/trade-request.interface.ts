import { IMembership } from '../../membership/types';

export interface ITradeRequest {
  requestedId: number;
  offeredId: number;
  trxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}
