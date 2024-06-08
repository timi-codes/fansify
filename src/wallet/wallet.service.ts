import { Injectable } from '@nestjs/common';
import { EncryptionService } from '../encryption';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user';
import { CreateMembershipInput } from 'src/membership/inputs';
import { Account, Chain, WalletClient, createWalletClient, encodePacked, formatEther, http, parseEther, publicActions } from 'viem';
import { generatePrivateKey, mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { EthereumAddress, IWallet, MembershipWithInclude, OnChainSummary } from 'src/common';
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

    /**
      * Create a wallet for a user.
     * @returns The wallet object containing the address, public key and private key digest.
    */
    public async createWallet(): Promise<IWallet & { onChainSummary: OnChainSummary }> {
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

        const onChainSummary = await this.transferFeeToCoverApproval(account.address, this.custodialWallet.address);

        return {
            address: wallet.address as EthereumAddress,
            publicKey: wallet.publicKey,
            privateKeyDigest: wallet.privateKeyDigest,
            onChainSummary
        }
    }

    /**
     * Mint a new wave token for new membership
     * 
     * @param creatorId The ID of the creator
     * @param data The data required to mint a new wave token
     * 
     * @returns The transaction hash and the token ID
     * 
     * @throws Error if the token minting fails
     */
    public async mintWaves(creatorId: number, data: CreateMembershipInput): Promise<OnChainSummary> {

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

        const message = `🎯Minting \nCreator:${user.walletAddress}(${user.id}) \nCollection:${encodedTokenID} \n#️⃣Transaction hash: ${trxHash}. \n🔭View on explorer: https://sepolia.basescan.org/tx/${trxHash}\n\n`
        console.info(message)
        return { trxHash, tokenId: encodedTokenID, message };
    }

    /**
     * Chec if address has a wave token
     * 
     * @param address The address to check
     * @param creatorId The ID of the creator
     * @param collectionTag The collection tag
     * 
     * @returns True if the address has a wave token, false otherwise
     * 
     * @throws Error if the check fails
     */
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

    /**
     * Transfer a wave token
     * 
     * @param from The address of the token owner
     * @param to The address of the token receiver
     * @param creatorId The ID of the creator
     * @param collectionTag The collection tag
     * 
     * @returns The transaction hash and a message
     * 
     * @throws Error if the transfer fails
     */
    public async transferWave(from: string, to: string, creatorId: number, collectionTag: string): Promise<OnChainSummary> {
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

        const message = `🎯Transferred \nCollection:${encodedTokenID} from \nCreator:${from} to \nGeneral:${to}  \n#️⃣Transaction hash: ${trxHash}. \n🔭View on explorer: https://sepolia.basescan.org/tx/${trxHash}\n\n`;
        console.info(message)
        return {
            trxHash,
            message
        }
    }

    /**
     * exhange wave membership between two users
     * 
     * @param requested the trade requested membership
     * @param offered the trade requester membership 
     * @returns summary of the transaction on chain
     * 
     * @throws Error if the exchange fails
     */
    public async exchangeWave(requested: MembershipWithInclude, offered: MembershipWithInclude): Promise<OnChainSummary> { 

        const trxHash = await this.client.writeContract({
            address: this.contractAddress,
            abi,
            functionName: 'exchangeWave',
            account: this.custodialWallet,
            args: [
                offered.owner.walletAddress,
                requested.owner.walletAddress,
                offered.tokenId,
                requested.tokenId
            ],
            chain: this.CHAIN,
        })

        const message = `🎯Exchanging \nRequested:${requested.owner.walletAddress}(${requested.tokenId}) \nOfferred:${offered.owner.walletAddress}(${offered.tokenId}). \n#️⃣Transaction hash: ${trxHash}. \n🔭View on explorer: https://sepolia.basescan.org/tx/${trxHash}\n\n`
        console.info(message)

        return {
            trxHash,
            message
        }
    }

    /** 
     *  We are transferring some ethers to the wallet to cover for the approval
     *  This is neccessary because we need to pay for the gas fee when the user wants to approve the custodian address to transfer tokens on their behalf
     *  the approved custodial wallet to transfer their tokens
     * 
     * @param owner The owner of the tokens
     * @param operator The operator to approve
     * 
     * @returns The transaction hash and a message
     * 
     * @throws Error if the transfer fails
     */
    private async transferFeeToCoverApproval(owner: string, operator: string): Promise<OnChainSummary> { 

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

        let transferMessage = `🎯Transferred ${formatEther(amountToTransfer)} to ${owner} to cover for approval process. \n#️⃣Transaction hash: ${trxHash}. \n🔭View on explorer: https://sepolia.basescan.org/tx/${trxHash}\n\n`

        // We are doing this now because we can't transfer and set approval at the stage. we wee need to ensure the transfer is already in the user wallet before
        // in real scenario, we will wait for the transfer to be confirmed before setting the approval using a pubsub or any other technique
        setTimeout(async () => { 
            const { message } = await this.setApprovalForAll(owner, operator, true)
            transferMessage += message
        }, 10000)
        console.info(transferMessage)

        return {
            trxHash,
            message: transferMessage
        }
    }

    /**
     * Set approval for all tokens
     * 
     * @param owner The owner of the tokens
     * @param operator The operator to approve
     * @param approved The approval status
     * 
     * @returns The transaction hash and a message
     * 
     * @throws Error if the approval fails
     */
    private async setApprovalForAll(owner: string, operator: string, approved: boolean): Promise<OnChainSummary> {

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
        const message = `🎯Setting approval \nfor ${owner}. \n #️⃣Transaction hash: ${trxHash}. \n🔭View on explorer: https://sepolia.basescan.org/tx/${trxHash}\n\n`;

        return {
            trxHash,
            message
        }
    }

}
