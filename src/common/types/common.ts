
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