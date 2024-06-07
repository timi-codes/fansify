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

export enum TradeStatus { 
    PENDING = 'PENDING',
    REJECTED = 'REJECTED',
    ACCEPTED = 'ACCEPTED',
    CANCELLED = 'CANCELLED',
}

registerEnumType(MembershipStatus, {
    name: 'MembershipStatus',
});

registerEnumType(TradeStatus, {
    name: 'TradeStatus',
});

export interface IPaginationOptions {
    limit: number;
    offset: number;
}