import { Injectable } from '@nestjs/common';
import { EncryptionService } from '../encryption';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user';
import { CreateMembershipInput } from 'src/membership/inputs';
import { Account, Chain, WalletClient, createWalletClient, encodePacked, formatEther, http, parseEther, publicActions } from 'viem';
import { generatePrivateKey, mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { EthereumAddress, IWallet, MembershipWithInclude, MintReceipt } from 'src/common';
import { PrismaService } from 'src/prisma';
import { baseSepolia } from 'viem/chains';
import { abi } from '../common/constants/WavesERC1155Token.json';

@Injectable()
export class WalletService {
    private client: WalletClient;
    private ENCRYPTION_KEY: string;
    private CHAIN: Chain;
    private custodialWallet: Account;
    private contractAddress: EthereumAddress;

    constructor(
        private readonly encryptionService: EncryptionService,
        private configService: ConfigService,
        private readonly userService: UserService,
        private readonly prismaService: PrismaService,
    ) {
        this.contractAddress = this.configService.get<EthereumAddress>('WAVES_TOKEN_CONTRACT_ADDRESS');
        this.ENCRYPTION_KEY = this.configService.get<string>('ENCRYPTION_KEY');
        this.CHAIN = baseSepolia as Chain;

        const contractDeployerPK = this.configService.get<EthereumAddress>('CONTRACT_DEPLOYER_MNEMONIC');
        this.custodialWallet = mnemonicToAccount(contractDeployerPK)

        this.client = createWalletClient({
            chain: this.CHAIN,
            transport: http(),
        })
    }

    public async createWallet(): Promise<IWallet> {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const keyBuffer = Buffer.from(this.ENCRYPTION_KEY, 'hex');
       
        const privateKeyDigest = this.encryptionService.encrypt(privateKey, keyBuffer);

        const wallet = await this.prismaService.wallet.create({
            data: {
                address: account.address as EthereumAddress,
                publicKey: account.publicKey,
                privateKeyDigest,
            }
        })

        await this.transferFeeToCoverApproval(account.address, this.custodialWallet.address);

        return {
            address: wallet.address as EthereumAddress,
            publicKey: wallet.publicKey,
            privateKeyDigest: wallet.privateKeyDigest,
        }
    }

    public async mintWaves(creatorId: number, data: CreateMembershipInput): Promise<MintReceipt> {

        const user = await this.userService.findOne({ id: creatorId });

        const encodedTokenID = encodePacked(
            ['string', 'string'],
            [data.collectionTag, user.id.toString()]
        );

        const encodedData = encodePacked(
            ['string', 'string', 'string', 'string', 'string'],
            [data.collectionTag, data.name, data.price.toString(), data.quantity.toString(), data.description]
        );

        const trxHash = await this.client.writeContract({
            address: this.contractAddress,
            abi,
            functionName: 'mint',
            account: this.custodialWallet,
            args: [user.walletAddress, encodedTokenID, data.quantity, encodedData],
            chain: this.CHAIN,
        })

        return { trxHash, tokenId: encodedTokenID };
    }

    public async hasWave(address: string, creatorId: number, collectionTag: string): Promise<boolean> {

        const encodedTokenID = encodePacked(
            ['string', 'string'],
            [collectionTag, creatorId.toString()]
        );

        const balance = await this.client.extend(publicActions).readContract({
            abi,
            address: this.contractAddress,
            functionName: 'balanceOf',
            args: [address, encodedTokenID],
        }) as number;

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

        const trxHash = await this.client.writeContract({
            address: this.contractAddress,
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


    // We are transferring some ethers to the wallet to cover for the approval process in the future.
    // This is neccessary because we need to pay for the gas fee when the user wants to approve the contract to transfer their tokens
    // the approved custodial wallet to transfer their tokens
    private async transferFeeToCoverApproval(owner: string, operator: string,): Promise<string> { 

        const payload = {
            address: this.contractAddress,
            abi,
            functionName: 'setApprovalForAll',
            args: [operator, true],
            chain: this.CHAIN,
            account: this.custodialWallet
        };


        //TODO: estimate gas and get gas price
        const estimatedContractGas = await this.client.extend(publicActions).estimateContractGas(payload)
        const gasPrice = await this.client.extend(publicActions).getGasPrice();

        const amountToTransfer = BigInt(estimatedContractGas) * BigInt(gasPrice)

        // transfer ethers to token owner to cover for the approval process
        const trxHash = await this.client.sendTransaction({
            to: owner,
            value: amountToTransfer + parseEther("0.001"), // adding more just in case
            account: this.custodialWallet,
            kzg: undefined,
            chain: this.CHAIN,
        });

        console.log(`\n🎯Transfering ${formatEther(amountToTransfer)} to ${owner} to cover for approval process. #️⃣Transaction hash: ${trxHash}. 🔭View on explorer: https://sepolia.basescan.org/tx//tx/${trxHash}`)

        // We are doing this now because we can't transfer and set approval at the stage. we wee need to ensure the transfer is already in the user wallet before
        // in real scenario, we will wait for the transfer to be confirmed before setting the approval using a pubsub or any other technique
        setTimeout(async () => { 
            this.setApprovalForAll(owner, operator, true)
        }, 10000)
        return trxHash
    }

    private async setApprovalForAll(owner: string, operator: string, approved: boolean): Promise<string> {

        const wallet = await this.prismaService.wallet.findUnique({ where: { address: owner } });

        const privateKey = this.encryptionService.decrypt(wallet.privateKeyDigest, Buffer.from(this.ENCRYPTION_KEY, 'hex'));
        const account = privateKeyToAccount(privateKey as EthereumAddress);

        const payload = {
            address: this.contractAddress,
            abi,
            functionName: 'setApprovalForAll',
            args: [operator, approved],
            chain: this.CHAIN,
            account
        };

        const trxHash = await this.client.writeContract(payload)
        console.log(`\n🎯Setting approval for ${operator} to ${approved} for ${owner}. #️⃣Transaction hash: ${trxHash}. 🔭View on explorer: https://sepolia.basescan.org/tx//tx/${trxHash}`)
        return trxHash
    }

}
