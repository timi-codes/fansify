import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { EncryptionService } from '../encryption';

@Injectable()
export class WalletService {

    constructor(private readonly encryptionService: EncryptionService) { }
    
    public async createWallet(): Promise<{ address: string, privateKeyHash: string }> {
        const wallet = ethers.Wallet.createRandom();
        const address = wallet.address;
        const privateKey = wallet.privateKey;
        
        return {
            address,
            privateKeyHash: this.encryptionService.generateHash(privateKey),
        };
    }
}
