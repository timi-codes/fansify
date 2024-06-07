import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { AccessTokenGuard, RolesGuard } from 'src/auth/guards';
import { ISuccessResponse, JoiValidationPipe, Roles, Role, CurrentUser, SuccessResponseModel, MembershipStatus, IPagedRequest, createSuccessResponse, DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from '../common';
import { CreateMembershipSchema } from './schema';
import { CreateMembershipInput } from './inputs';
import { MembershipService } from './membership.service';
import { WalletService } from 'src/wallet';
import { Membership } from '@prisma/client';
import { MembershipModel, PagedMembershipsModel } from './model';

@ObjectType()
class MembershipSuccessResponse extends SuccessResponseModel<Membership>(MembershipModel) { }

@Resolver()
export class MembershipResolver {
    constructor(
        private membershipService: MembershipService,
        private walletService: WalletService,
    ) { }
    
    /**
     *  Create single or multiple memberships.
     * @param payload The data required to create a new membership
     * @param creator The user data object containing the current user's ID
     * @returns The created membership record
     * 
     * @throws an error if the membership record could not be created
     */
    @Mutation(() => MembershipSuccessResponse, {
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
            const mintReceipt = await this.walletService.mintWaves(creator.id, payload)
            if (!mintReceipt.trxHash) {
                return createSuccessResponse(false, 'Failed to mint membership', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const memberships = await this.membershipService.createMany(payload, creator.id, mintReceipt)
            return createSuccessResponse(true, 'Membership created successfully', HttpStatus.CREATED, memberships);

        } catch (e) {
            console.error(`[createMembership mutation] ${e}`);
            return createSuccessResponse(false, 'Failed to create membership', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Retrieve all the membership.
     *
     * @param limit The maximum number of items to return
     * @param offset The index of the first item to return.
     * @param status The status of the membership.
     * @returns The membership records
     * 
     * @throws an error if the membership records could not be retrieved
     */
    @Query(() => PagedMembershipsModel, { description: "Retrieve all memberships" })
    @UseGuards(AccessTokenGuard)
    async fetchAllMembership(
        @Args('limit', {
            description: 'The maximum number of items to return',
            type: () => Int,
            defaultValue: DEFAULT_PAGE_LIMIT
        })
        limit: number,
        @Args('offset', {
            description: 'The index of the first item to return.',
            type: () => Int,
            defaultValue: DEFAULT_PAGE_OFFSET
        })
        offset: number,
        @Args('status', {
            description: 'The status of the membership. ',
            type: () => MembershipStatus,
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
            defaultValue: DEFAULT_PAGE_LIMIT
        })
        limit: number,
        @Args('offset', {
            description: 'The index of the first item to return.',
            type: () => Int,
            defaultValue: DEFAULT_PAGE_OFFSET
        })
        offset: number,
        @Args('status', {
            description: 'The status of the membership. ',
            type: () => MembershipStatus,
            nullable: true,
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
