import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { EncryptionService } from '../encryption';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user';
import { CreateMembershipInput } from 'src/membership/inputs';
import { Account, Chain, WalletClient, createWalletClient, encodePacked, http, publicActions } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { EthereumAddress, IWallet, MembershipWithInclude, MintReceipt } from 'src/common';
import { PrismaService } from 'src/prisma';
import { localhost } from 'viem/chains';
import { abi } from '../common/constants/WavesERC1155Token.json';

@Injectable()
export class WalletService {
    private client: WalletClient;
    private ENCRYPTION_KEY: string;
    private CHAIN: Chain;
    private custodialWallet: Account

    constructor(
        private readonly encryptionService: EncryptionService,
        private configService: ConfigService,
        private readonly userService: UserService,
        private readonly prismaService: PrismaService,
    ) {
        this.ENCRYPTION_KEY = this.configService.get<string>('ENCRYPTION_KEY');
        this.CHAIN = { ...localhost, id: 31337 }

        const contractDeployerPK = this.configService.get<EthereumAddress>('CONTRACT_DEPLOYER_PK_DIGEST');
        this.custodialWallet = privateKeyToAccount(contractDeployerPK)

        this.client = createWalletClient({
            chain: localhost,
            transport: http(),
        })
    }

    public async createWallet(): Promise<IWallet> {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const keyBuffer = Buffer.from(this.ENCRYPTION_KEY, 'hex');
       
        const privateKeyDigest = this.encryptionService.encrypt(privateKey, keyBuffer);
        console.log(privateKey , privateKeyDigest, account.address)
        const wallet = await this.prismaService.wallet.create({
            data: {
                address: account.address as EthereumAddress,
                publicKey: account.publicKey,
                privateKeyDigest,
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

    public async mintWaves(creatorId: number, data: CreateMembershipInput): Promise<MintReceipt> {
        const contractAddress = this.configService.get<string>('WAVES_TOKEN_CONTRACT_ADDRESS');
        const contractDeployerPKDigest = this.configService.get<EthereumAddress>('CONTRACT_DEPLOYER_PK_DIGEST');

        const user = await this.userService.findOne({ id: creatorId });

        const encodedTokenID = encodePacked(
            ['string', 'string'],
            [data.collectionTag, user.id.toString()]
        );
        console.log('encodedTokenID', encodedTokenID, data.collectionTag, user.id.toString())

        const encodedData = encodePacked(
            ['string', 'string', 'string', 'string', 'string'],
            [data.collectionTag, data.name, data.price.toString(), data.quantity.toString(), data.description]
        );

        const trxHash = await this.client.writeContract({
            address: contractAddress as EthereumAddress,
            abi,
            functionName: 'mint',
            account: privateKeyToAccount(contractDeployerPKDigest),
            args: [user.walletAddress, encodedTokenID, data.quantity, encodedData],
            chain: this.CHAIN,
        })
        console.log("==>", trxHash)
        // Set approval for custodial wallet to transfer the token
        await this.setApprovalForAll(user.walletAddress, this.custodialWallet.address, true);

        return { trxHash, tokenId: encodedTokenID };
    }

    public async hasWave(address: string, creatorId: number, collectionTag: string): Promise<boolean> {
        const contractAddress = this.configService.get<string>('WAVES_TOKEN_CONTRACT_ADDRESS');

        const encodedTokenID = encodePacked(
            ['string', 'string'],
            [collectionTag, creatorId.toString()]
        );

        console.log('encodedTokenID', encodedTokenID, collectionTag, creatorId.toString())
        const balance = await this.client.extend(publicActions).readContract({
            abi,
            address: contractAddress as EthereumAddress,
            functionName: 'balanceOf',
            args: [address, encodedTokenID],
        }) as number;
        console.log('balance', balance)
        return Number(balance) > 0;
    }

    public async transferWave(from: string, to: string, creatorId: number, collectionTag: string): Promise<string> {
        const contractAddress = this.configService.get<string>('WAVES_TOKEN_CONTRACT_ADDRESS');
        
        const encodedTokenID = encodePacked(
            ['string', 'string'],
            [collectionTag, creatorId.toString()]
        );

        const trxHash = await this.client.writeContract({
            address: contractAddress as EthereumAddress,
            abi,
            functionName: 'safeTransferFrom',
            account: this.custodialWallet,
            args: [from, to, encodedTokenID, 1, '0x'],
            chain: this.CHAIN,
        })
        return trxHash;
    }

    public async exchangeWave(requested: MembershipWithInclude, offered: MembershipWithInclude): Promise<string> { 
        const contractAddress = this.configService.get<string>('WAVES_TOKEN_CONTRACT_ADDRESS');
        console.log('exchangeWave', requested, offered)
        const trxHash = await this.client.writeContract({
            address: contractAddress as EthereumAddress,
            abi,
            functionName: 'exchangeWave',
            account: this.custodialWallet,
            args: [
                requested.owner.walletAddress,
                offered.owner.walletAddress,
                requested.tokenId,
                offered.tokenId
            ],
            chain: this.CHAIN,
        })

        return trxHash;
    }

    private async setApprovalForAll(owner: string, operator: string, approved: boolean): Promise<string> {
        const contractAddress = this.configService.get<string>('WAVES_TOKEN_CONTRACT_ADDRESS');

        const wallet = await this.prismaService.wallet.findUnique({ where: { address: owner } });

        const privateKey = this.encryptionService.decrypt(wallet.privateKeyDigest, Buffer.from(this.ENCRYPTION_KEY, 'hex'));
        const account = privateKeyToAccount(privateKey as EthereumAddress);

        const payload = {
            address: contractAddress as EthereumAddress,
            abi,
            functionName: 'setApprovalForAll',
            account,
            args: [operator, approved],
            chain: this.CHAIN,
        };

        const estimatedGas = await this.client.extend(publicActions).estimateContractGas(payload);
        const estimatedGasInWei = BigInt(estimatedGas) * BigInt(10 ** 9);

        // transfer ethers to token owner to pay for gas for the transaction
        await this.client.sendTransaction({
            to: owner,
            value: estimatedGasInWei,
            account: this.custodialWallet,
            kzg: undefined,
            chain: this.CHAIN,
        });
        

        const trxHash = await this.client.writeContract(payload)
        return trxHash
    }

}
