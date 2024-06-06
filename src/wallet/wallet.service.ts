import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { EncryptionService } from '../encryption';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user';
import { Prisma } from '@prisma/client';
import { CreateMembershipInput } from 'src/membership/inputs';
import { artifacts } from 'hardhat';
import { sepolia, localhost } from 'viem/chains'
import { WalletClient, createWalletClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { EthereumAddress, IWallet } from 'src/common';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma';

@Injectable()
export class WalletService {
    private client: WalletClient;
    private ENCRYPTION_KEY: string;

    constructor(
        private readonly encryptionService: EncryptionService,
        private configService: ConfigService,
        private readonly userService: UserService,
        private readonly prismaService: PrismaService,
    ) {
        this.ENCRYPTION_KEY = this.configService.get<string>('ENCRYPTION_KEY');
        const key = crypto.randomBytes(32);

        const ETHEREUM_RPC_URL = this.configService.get<string>('ETHEREUM_RPC_URL');
        // const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
        this.client = createWalletClient({
            chain: localhost,
            transport: http(ETHEREUM_RPC_URL),
        })
    }

    public async createWallet(): Promise<IWallet> {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const keyBuffer = Buffer.from(this.ENCRYPTION_KEY, 'hex');

        const wallet = await this.prismaService.wallet.create({
            data: {
                address: account.address as EthereumAddress,
                publicKey: account.publicKey,
                privateKeyDigest: this.encryptionService.encrypt(privateKey, keyBuffer),
            }
        })

        return {
            address: wallet.address as EthereumAddress,
            publicKey: wallet.publicKey,
            privateKeyDigest: wallet.privateKeyDigest,
        }
    }

    private async getWallet(privateKeyDigest: string): Promise<ethers.Wallet> {
        const keyBuffer = Buffer.from(this.ENCRYPTION_KEY, 'hex');
        const privateKey = this.encryptionService.decrypt(privateKeyDigest, keyBuffer);
        const wallet = new ethers.Wallet(privateKey);
        return wallet;
    }

    public async mintWaves(creatorId: number, data: CreateMembershipInput): Promise<string> {
        const contractAddress = this.configService.get<string>('WAVES_TOKEN_CONTRACT_ADDRESS');
        const contractDeployerPKDigest = this.configService.get<EthereumAddress>('CONTRACT_DEPLOYER_PK_DIGEST');
        const artifact = await artifacts.readArtifact("WavesERC1155Token");

        const user = await this.userService.findOne({ id: creatorId });
        // const byteData = ethers.encodeBase58(JSON.stringify(data));

        const accounts = await this.client.writeContract({
            address: contractAddress as EthereumAddress,
            abi: artifact.abi,
            functionName: 'mint',
            account: privateKeyToAccount(contractDeployerPKDigest),
            args: [user.walletAddress, data.name, data.quantity, "0x" + JSON.stringify(data)],
            chain: localhost,
        })

        // contractDeployerPKDigest,
        //     contractAddress,
        //     'mint',
        //     [data.walletAddress, data.name, data.quantity, data]
        console.log('accounts', accounts)


        // const wallet = await this.client.wallet.getWallet(contractDeployerPKDigest);

 

        // const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
        // const tx = await contract.mint(user.walletAddress, data.name, data.quantity, data);
        return "tx.hash";
    }

}
