import { TradeRequest } from '@prisma/client';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import {
  CurrentUser,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_OFFSET,
  IPagedRequest,
  ISuccessResponse,
  Role,
  Roles,
  SuccessResponseModel,
  TradeStatus,
  createSuccessResponse,
} from '../common';

import { AccessTokenGuard, RolesGuard } from '../auth/guards';
import { PagedTradeRequestsModel, TradeRequestModel } from './models';
import { UserService } from '../user';
import { TradingService } from './trading.service';
import { MembershipService } from '../membership';
import { WalletService } from '../wallet';

@ObjectType()
class AcceptTradeSuccessResponse extends SuccessResponseModel<TradeRequest>(TradeRequestModel) { }

@ObjectType()
class DeclineTradeSuccessResponse extends SuccessResponseModel<TradeRequest>(TradeRequestModel) { }

@ObjectType()
class RequestTradeSuccessResponse extends SuccessResponseModel<TradeRequest>(TradeRequestModel) { }


@Resolver()
export class TradingResolver {
  constructor(
    private userService: UserService,
    private tradingService: TradingService,
    private membershipService: MembershipService,
    private walletService: WalletService,
  ) {}

  /**
   * Retrieve all the trade requests.
   *
   * @param limit The maximum number of items to return
   * @param offset The index of the first item to return.
   *
   * @param user The user data object containing the current user's ID
   */
  @Query(() => PagedTradeRequestsModel, {
    description: 'Retrieve all the trade requests.',
  })
  @UseGuards(AccessTokenGuard)
  async tradeRequests(
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
      description: 'The status of the trade request. ',
      type: () => TradeStatus,
      nullable: true,
    })
    status: string,
  ): Promise<IPagedRequest<TradeRequest, number>> {
    
    try {
      const whereCondition: any = status ? { status } : undefined;
      const [data, count] = await Promise.all([
        this.tradingService.findMany(
          { limit, offset },
          { createdAt: 'desc' },
          whereCondition
        ),
        this.tradingService.count(whereCondition)
      ]);

      return { count, data, limit, offset }
    } catch (e) {
      console.error(`[fetchAllMembership query] ${e}`);
    }
  }

  /**
   * Accept the trade of owned membership with another user’s owned membership.
   *
   * @param id The ID of the trade.
   *
   * @param user The user data object containing the current user's ID
   */
  @Mutation(() => AcceptTradeSuccessResponse, {
    description:
      'Accept the trade of owned membership with another user’s owned membership.',
  })
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.General)
  async acceptTrade(
    @Args('id', {
      description: 'The ID of the trade.',
      type: () => Int,
    })
    id: number,
    @CurrentUser() currentUser: { id: number },
  ): Promise<ISuccessResponse<TradeRequest>> {

    try {
      const trade = await this.tradingService.findOne({ id });
      if (!trade) {
        return createSuccessResponse(false, 'Trade request not found.', HttpStatus.NOT_FOUND)
      }

      if (trade.status != TradeStatus.PENDING) {
        return createSuccessResponse(false, `Trade request has already been ${trade.status.toLowerCase()}`, HttpStatus.BAD_REQUEST)
      }

      const [requested, offered] = await this.membershipService.findByIds([
        trade.requestedId, trade.offeredId],
        { creator: true, owner: true }
      )

      if (requested.ownerId != currentUser.id) {
        return createSuccessResponse(false, 'You are not allowed to perform this action.', HttpStatus.UNAUTHORIZED)
      }

      const trxHash = await this.walletService.exchangeWave(requested, offered)
      if (!trxHash) {
        return createSuccessResponse(false, 'Failed to accept trade', HttpStatus.INTERNAL_SERVER_ERROR)
      }

      await Promise.all([
        this.membershipService.update({ id: requested.id }, { owner: { connect: { id: offered.ownerId } } }),
        this.membershipService.update({ id: offered.id }, { owner: { connect: { id: requested.ownerId } } }),
      ])

      const data = await this.tradingService.update({ id }, { status: TradeStatus.ACCEPTED, trxHash });

      return createSuccessResponse(true, 'Trade request has been successfully accepted.', HttpStatus.OK, data);
    
    } catch (e) {
      console.error(`[acceptTrade mutation] ${e}`);
      return createSuccessResponse(false, 'Something weird happened. Please try again, and connect with us if it persists.', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Decline the trade of owned membership with another user’s owned membership
   *
   * @param id The ID of the trade.
   *
   * @param user The user data object containing the current user's ID
   */
  @Mutation(() => DeclineTradeSuccessResponse, {
    description:
      'Decline the trade of owned membership with another user’s owned membership.',
  })
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.General)
  async declineTrade(
    @Args('id', {
      description: 'The ID of the trade request.',
      type: () => Int,
    })
    id: number,
    @CurrentUser() user: { id: number },
  ): Promise<ISuccessResponse<TradeRequest>> {

    try {
      const trade = await this.tradingService.findOne({ id }, { requested: true });
      if (!trade) {
        return createSuccessResponse(false, 'Trade request not found.', HttpStatus.NOT_FOUND)
      }

      if (trade.status != TradeStatus.PENDING) {
        return createSuccessResponse(false, `Trade request has already been ${trade.status.toLowerCase()}`, HttpStatus.BAD_REQUEST)
      }

      if (trade.requested.ownerId != user.id) {
        return createSuccessResponse(false, 'You are not allowed to perform this action.', HttpStatus.UNAUTHORIZED)
      }

      const data = await this.tradingService.update({ id }, { status: TradeStatus.REJECTED });

      return createSuccessResponse(true, 'Trade request has been successfully declined.', HttpStatus.OK, data);
    } catch (e) {
      console.error(`[declineTrade mutation] ${e}`);
      return createSuccessResponse(false, 'Something weird happened. Please try again, and connect with us if it persists.', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Buy a membership from a creator
   *
   * @param requestedId The ID of the membership.
   * @param offeredId The ID of the membership.
   *
   * @param user Request a trade for a membership
   */
  @Mutation(() => RequestTradeSuccessResponse, {
    description: 'Request a trade for a membership.',
  })
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.General)
  async requestTrade(
    @Args('requestedId', {
      description:
        'The ID of the membership that the user is requesting to obtain.',
      type: () => Int,
    })
    requestedId: number,
    @Args('offeredId', {
      description:
        'The ID of the membership that the user is offering to trade.',
      type: () => Int,
    })
    offeredId: number,
    @CurrentUser() user: { id: number, walletAddress: string },
  ): Promise<ISuccessResponse<TradeRequest>> {

    try {

      if (requestedId === offeredId) { 
        return createSuccessResponse(false, 'You cannot request a trade for the same membership.', HttpStatus.BAD_REQUEST)
      }

      const [requestedMembership, offeredMembership] = await Promise.all([
        this.membershipService.findOne({ id: requestedId }),
        this.membershipService.findOne({ id: offeredId }, { owner: true }),
      ]);

      if (!requestedMembership || !offeredMembership) {
        return createSuccessResponse(false, 'Invalid requested or offered ID.', HttpStatus.BAD_REQUEST)
      }

      if (user.id != offeredMembership.ownerId)
        return createSuccessResponse(false, 'You do not own the offered membership.', HttpStatus.UNAUTHORIZED)

      const hasWave = await this.walletService.hasWave(user.walletAddress, offeredMembership.creatorId, offeredMembership.collectionTag);
      if (!hasWave) {
        return createSuccessResponse(false, 'You do not own the offered membership.', HttpStatus.UNAUTHORIZED)
      }

      const data = await this.tradingService.create({
        requestedId,
        offeredId,
        userId: user.id,
      });

      return createSuccessResponse(true, 'Trade request has been successfully submitted.', HttpStatus.CREATED, data);
    } catch (e) {
      console.error(`[requestTrade mutation] ${e}`);

      return createSuccessResponse(false, 'Something weird happened. Please try again, and connect with us if it persists.', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
