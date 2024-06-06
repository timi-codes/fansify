import { IMembership } from '../types';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { MembershipStatus, UserModel } from 'src/common';

@ObjectType({ description: 'A data model representing a membership' })
export class MembershipModel implements IMembership {


  @Field(() => Int, { description: 'The ID of the membership.' })
  id: number;

  @Field(() => String, { description: 'The unique identifier for a membership.' })
  tag: string;

  @Field(() => String, { description: 'The description of the membership.' })
  name: string;

  @Field(() => String, { description: 'The description of the membership.' })
  description: string;

  @Field(() => Float, { description: 'The price of the membership.' })
  price: number;

  @Field(() => String, { description: 'The transaction hash of the minted token' })
  trxHash: string;

  @Field(() => MembershipStatus, { description: 'The creator of the membership.' })
  status: string;

  @Field(() => Date, { description: 'The date the user was created.' })
  updatedAt: Date;

  @Field(() => Date, { description: 'The date the user was created.' })
  createdAt: Date;

  @Field(() => String, { description: 'The wallet address of owner' })
  ownerAddress: string;

  @Field(() => String, { description: 'The wallet address of the creator' })
  creatorAddress?: string;
}
