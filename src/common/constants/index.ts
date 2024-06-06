import { Role } from "../types";
import { defineChain } from "viem";

export const Environment = {
  Development: 'development',
};

export const roleArr = Object.values(Role);
export const RoleArr = Object.values(Role) as Role[];
