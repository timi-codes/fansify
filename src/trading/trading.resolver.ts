import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CurrentUser,
  IPagedRequest,
  ISuccessResponse,
  Role,
  Roles,
  SuccessResponseModel,
  TradeStatus,
  createSuccessResponse,
} from '../common';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { AccessTokenGuard, RolesGuard } from '../auth/guards';
import { PagedTradeRequestsModel } from './models';
import { ITradeRequest } from './types';
import { UserService } from '../user';
import { TradingService } from './trading.service';
import { GraphQLException } from '@nestjs/graphql/dist/exceptions';
import { MembershipService } from 'src/membership/membership.service';
import { WalletService } from 'src/wallet';

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
      nullable: true,
    })
    limit: number,
    @Args('offset', {
      description: 'The index of the first item to return.',
      type: () => Int,
      nullable: true,
    })
    offset: number,
    @CurrentUser() user: { id: number },
  ): Promise<IPagedRequest<ITradeRequest, number>> {
    const currentUser = await this.userService.validateRole(user.id, [Role.General]);

    if (!currentUser) {
      throw new GraphQLException(
        'You are not allowed to perform this action.',
        {
          extensions: {
            http: {
              status: HttpStatus.UNAUTHORIZED,
            },
          },
        },
      );
    }

    const [data, count] = await Promise.all([
      this.tradingService.findMany(
        { userId: currentUser.id },
        { limit: limit || 20, offset: offset || 0 },
        { createdAt: 'desc' },
      ),
      this.tradingService.count({ userId: currentUser.id }),
    ]);

    return {
      offset: offset || 0,
      limit: limit || 20,
      count: count,
      data:[]
        
      //   data.map(({ createdAt }) => ({
      //   requested: { id: -1 }, // 📝 Complete by adding actual requested membership
      //   offered: { id: -1 }, // 📝 Complete by adding actual offered membership
      //   createdAt,
      // })),
    };
  }

  /**
   * Accept the trade of owned membership with another user’s owned membership.
   *
   * @param id The ID of the trade.
   *
   * @param user The user data object containing the current user's ID
   */
  @Mutation(() => SuccessResponseModel, {
    description:
      'Accept the trade of owned membership with another user’s owned membership.',
  })
  @UseGuards(AccessTokenGuard)
  async acceptTrade(
    @Args('id', {
      description: 'The ID of the trade.',
      type: () => Int,
    })
    id: number,
    @CurrentUser() currentUser: { id: number },
  ): Promise<ISuccessResponse> {

    //check if trade exists
    //check if trade is pending
    //check if user is the owner of the requested membership
    //update trade status to accepted

    try {
      const trade = await this.tradingService.findOne({ id });
      if (!trade) {
        return createSuccessResponse(false, 'Trade request not found.', HttpStatus.NOT_FOUND)
      }

      if (trade.status != TradeStatus.PENDING) {
        return createSuccessResponse(false, `Trade request has already been ${trade.status.toLowerCase()}`, HttpStatus.BAD_REQUEST)
      }

      const [requestedMembership, offeredMembership] = await this.membershipService.findByIds([
        trade.requestedId, trade.offeredId],
        { creator: true }
      )

      if (requestedMembership.ownerId != currentUser.id) {
        return createSuccessResponse(false, 'You are not allowed to perform this action.', HttpStatus.UNAUTHORIZED)
      }

      const requesterHasWave = await this.walletService.hasWave(trade.user.walletAddress, offeredMembership.creatorId, offeredMembership.collectionTag);
      if (!requesterHasWave) {
        return createSuccessResponse(false, 'Requester does not own the offered membership.', HttpStatus.UNAUTHORIZED)
      }

      const ownerHasWave = await this.walletService.hasWave(requestedMembership.owner.walletAddress, requestedMembership.creatorId, requestedMembership.collectionTag);
      if (!ownerHasWave) {
        return createSuccessResponse(false, 'You do not own the requested membership.', HttpStatus.UNAUTHORIZED)
      }



      return {
        isSuccess: false,
        message:
          'Something weird happened. Please try again, and connect with us if it persists.',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {},
      };
    } catch (e) {
      console.error(`[acceptTrade mutation] ${e}`);

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
   * Decline the trade of owned membership with another user’s owned membership
   *
   * @param id The ID of the trade.
   *
   * @param user The user data object containing the current user's ID
   */
  @Mutation(() => SuccessResponseModel, {
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
  ): Promise<ISuccessResponse> {

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
   * Buy a membership from a creator
   *
   * @param requestedId The ID of the membership.
   * @param offeredId The ID of the membership.
   *
   * @param user Request a trade for a membership
   */
  @Mutation(() => SuccessResponseModel, {
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
  ): Promise<ISuccessResponse> {

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

      return createSuccessResponse(true, 'Trade request has been successfully submitted.', HttpStatus.OK, data);
    } catch (e) {
      console.error(`[requestTrade mutation] ${e}`);

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
