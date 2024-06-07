import { Role } from "../types";
import { defineChain } from "viem";

export const Environment = {
  Development: 'development',
};

export const roleArr = Object.values(Role);
export const RoleArr = Object.values(Role) as Role[];

export const  DEFAULT_PAGE_OFFSET = 0;
export const DEFAULT_PAGE_LIMIT = 20;
