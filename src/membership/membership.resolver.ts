import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { MembershipModel } from './model';
import { AccessTokenGuard, RolesGuard } from 'src/auth/guards';
import { ISuccessResponse, JoiValidationPipe, Roles, Role, CurrentUser, SuccessResponseModel } from '../common';
import { CreateMembershipSchema } from './schema';
import { CreateMembershipInput } from './inputs';
import { IMembership } from './types'
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
            const { quantity } = payload
 
            let memberships = []

            const membership = await this.membershipService.findOne({ name: payload.name })

            if (membership) { 
                return {
                    isSuccess: false,
                    message: 'A membership with this name already exists. Please try again.',
                    statusCode: HttpStatus.CONFLICT,
                }
            }

            const trxHash = await this.walletService.mintWaves(creator.id, payload)
            console.log('trxHash', trxHash)
            
            if (quantity > 1) {
                memberships = await this.membershipService.createMany(payload, creator.id)
            } else {
                const membership = await this.membershipService.create(payload, creator.id)
                memberships = memberships.concat(membership)
            }

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
