import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AccessTokenGuard, RolesGuard } from 'src/auth/guards';
import { ISuccessResponse, JoiValidationPipe, Roles, Role, CurrentUser, SuccessResponseModel } from '../common';
import { CreateMembershipSchema } from './schema';
import { CreateMembershipInput } from './inputs';
import { MembershipService } from './membership.service';
import { WalletService } from 'src/wallet';

@Resolver()
export class MembershipResolver {
    constructor(
        private membershipService: MembershipService,
        private walletService: WalletService,
    ) { }
    
    /**
     *  Create single or multiple memberships.
     * @param payload The data required to create a new membership
     */
    @Mutation(() => SuccessResponseModel, {
        description: 'Create single or multiple memberships.'
    })
    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles(Role.Creator)
    async createMembership(
        @Args('payload', new JoiValidationPipe(CreateMembershipSchema))
        payload: CreateMembershipInput,
        @CurrentUser() creator: { id: number },
    ): Promise<ISuccessResponse> {
   
        try {
            const tagExists = await this.membershipService.tagExists(payload.tag)
            if (tagExists) { 
                return {
                    isSuccess: false,
                    message: 'A membership with this tag already exists. Please try a different tag.',
                    statusCode: HttpStatus.BAD_REQUEST,
                }
            }

            const trxHash = await this.walletService.mintWaves(creator.id, payload)
            if (!trxHash) {
                return {
                    isSuccess: false,
                    message: 'Something went wrong while minting the token. Please try again.',
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                }
            }
            const memberships = await this.membershipService.createMany(payload, creator.id, trxHash)

            return {
                isSuccess: true,
                message: 'Successfully created your membership.',
                statusCode: HttpStatus.CREATED,
                data: memberships
            }

        } catch (e) {
            console.error(`[createMembership mutation] ${e}`);

            return {
                isSuccess: false,
                message:
                    'Something weird happened. Please try again, and connect with us if it persists.',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                data: null,
            };
        }
    }
}
