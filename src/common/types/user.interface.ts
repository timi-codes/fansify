import { Role } from './common';

export interface IUser {
  id: number;
  username: string;
  role: Role;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}
