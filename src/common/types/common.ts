import { RoleArr } from '../constants';

export type Role = (typeof RoleArr)[number];
export type EthereumAddress = `0x${string}`;
