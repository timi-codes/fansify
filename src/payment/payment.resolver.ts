import { Args, Int, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { CurrentUser, ISuccessResponse, MembershipStatus, Role, Roles, SuccessResponseModel, createSuccessResponse } from '../common';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { AccessTokenGuard, RolesGuard } from '../auth/guards';
import { MembershipService } from 'src/membership/membership.service';
import { WalletService } from 'src/wallet';
import { UserService } from 'src/user';
import { Membership } from '@prisma/client';
import { MembershipModel } from 'src/membership/model';

@ObjectType()
class SuccessResponse extends SuccessResponseModel(MembershipModel) { }


@Resolver()
export class PaymentResolver {
  constructor(
    private membershipService: MembershipService,
    private walletService: WalletService,
    private userService: UserService,
  ) { }
  
  /**
   * Buy a membership from a creator
   *
   * @param id The ID of the membership.
   *
   * @param user The user data object containing the current user's ID
   */
  @Mutation(() => SuccessResponse, {
    description: 'Buy a membership from a creator.',
  })
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(Role.General)
  async buyMemberships(
    @Args('id', {
      description: 'The ID of the membership.',
      type: () => Int,
    })
    id: number,
    @CurrentUser() currentUser: { id: number },
  ): Promise<ISuccessResponse<Membership>> {

    try {

      const membership = await this.membershipService.findOne({ id, status: MembershipStatus.UNSOLD }, { creator: true });
      if (!membership) {
        return createSuccessResponse(false, 'Membership not found or has been sold', HttpStatus.NOT_FOUND);
      }


      const isWaveAvailable = await this.walletService.hasWave(membership.creator.walletAddress, membership.creatorId, membership.collectionTag);
      if (!isWaveAvailable) {
        return createSuccessResponse(false, 'Creator does not have enough membership to sell', HttpStatus.BAD_REQUEST);
      }

      const user = await this.userService.findOne({ id: currentUser.id });

      const trxHash = await this.walletService.transferWave(membership.creator.walletAddress, user.walletAddress, membership.creatorId, membership.collectionTag);

      if (!trxHash) {
        return createSuccessResponse(false, 'Failed to buy membership', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const updatedMembership = await this.membershipService.update({ id }, { 
        owner: { connect: { id: currentUser.id } },
        status: MembershipStatus.SOLD
      });
      
      return createSuccessResponse(true, 'Membership bought successfully', HttpStatus.OK, updatedMembership);

    } catch (e) {
      console.error(`[buyMemberships query] ${e}`);
      return createSuccessResponse(false, 'Failed to buy membership', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
