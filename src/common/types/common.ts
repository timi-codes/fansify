import { registerEnumType } from "@nestjs/graphql";

export enum Role { 
    General = 'general',
    Creator = 'creator'
}

export type EthereumAddress = `0x${string}`;

export interface IWallet { 
    address: EthereumAddress;
    publicKey: string;
    privateKeyDigest: string;
}

export enum MembershipStatus {
    SOLD = 'SOLD',
    UNSOLD = 'UNSOLD',
}

registerEnumType(MembershipStatus, {
    name: 'MembershipStatus',
});

export interface IPaginationOptions {
    limit: number;
    offset: number;
}