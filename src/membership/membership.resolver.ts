import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenGuard, RolesGuard } from 'src/auth/guards';
import { ISuccessResponse, JoiValidationPipe, Roles, Role, CurrentUser, SuccessResponseModel, MembershipStatus, IPagedRequest } from '../common';
import { CreateMembershipSchema } from './schema';
import { CreateMembershipInput } from './inputs';
import { MembershipService } from './membership.service';
import { WalletService } from 'src/wallet';
import { Membership } from '@prisma/client';
import { PagedMembershipsModel } from './model';

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
    ): Promise<ISuccessResponse<Membership[]>> {
   
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


    /**
     * Retrieve all the membership.
     *
     * @param limit The maximum number of items to return
     * @param offset The index of the first item to return.
     */
    @Query(() => PagedMembershipsModel, { description: "Retrieve all memberships" })
    @UseGuards(AccessTokenGuard)
    async fetchAllMembership(
        @Args('limit', {
            description: 'The maximum number of items to return',
            type: () => Int,
            nullable: true,
            defaultValue: 20
        })
        limit: number,
        @Args('offset', {
            description: 'The index of the first item to return.',
            type: () => Int,
            nullable: true,
            defaultValue: 0
        })
        offset: number,
        @Args('status', {
            description: 'The status of the membership. ',
            type: () => MembershipStatus,
            nullable: true,
            defaultValue: null
        })
        status: string,
    ): Promise<IPagedRequest<Membership, number>>{
        try {
            const whereCondition: any = status ? { status } : undefined;
            const [data, count] = await Promise.all([
                this.membershipService.findMany(
                    { limit, offset },
                    { createdAt: 'desc' },
                    whereCondition
                ),
                this.membershipService.count(whereCondition)
            ]);
        
            return { count, data, limit, offset }
        } catch (e) {
            console.error(`[fetchAllMembership query] ${e}`);
        }
    }

    /**
 * Retrieve current user's membership.
 *
 * @param limit The maximum number of items to return
 * @param offset The index of the first item to return.
 */
    @Query(() => PagedMembershipsModel, { description: "Retrieve current user's memberships" })
    @UseGuards(AccessTokenGuard)
    async fetchMyMembership(
        @Args('limit', {
            description: 'The maximum number of items to return',
            type: () => Int,
            defaultValue: 20
        })
        limit: number,
        @Args('offset', {
            description: 'The index of the first item to return.',
            type: () => Int,
            defaultValue: 0
        })
        offset: number,
        @Args('status', {
            description: 'The status of the membership. ',
            type: () => MembershipStatus,
            nullable: true,
            defaultValue: null
        })
        status: string,
        @CurrentUser() user: { id: number },
    ): Promise<IPagedRequest<Membership, number>> {
        try {
            const whereCondition: any = { owner: { id: user.id } };
            if (status) whereCondition.status = status;
            
            const [data, count] = await Promise.all([
                this.membershipService.findMany(
                    { limit, offset },
                    { createdAt: 'desc' },
                    whereCondition
                ),
                this.membershipService.count(whereCondition)
            ]);

            return { count, data, limit, offset }
        } catch (e) {
            console.error(`[fetchAllMembership query] ${e}`);
        }
    }
}
