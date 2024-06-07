import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IMembership } from '../../membership/types';
import { MembershipModel } from '../../membership/model';
import { ITradeRequest } from '../types';
import { TradeStatus } from 'src/common';

@ObjectType({ description: '' })
export class TradeRequestModel implements ITradeRequest {
  @Field(() => Int, { description: 'The ID of the trade request.' })
  id: number;

  @Field(() => TradeStatus, {
    description: 'The status of the trade request.',
  })
  status: string;

  @Field(() => Date, {
    description: 'The date that the trade request was made.',
  })
  createdAt: Date;

    
  @Field(() => Date, {
    description: 'The date that the trade request was update.',
  })
  updatedAt: Date;

  @Field(() => Int, {
    description: 'Data about the requested membership.',
  })
  userId: number;

  @Field(() => Int, {
    description: 'Data about the offered membership.',
  })
  offeredId: number;
  
  @Field(() => Int, {
    description: 'Data about the requested membership.',
  })
  requestedId: number;


  @Field(() => String, {
    nullable: true,
    description: 'The onchain transaction hash for token exchange.',
  })
  trxHash?: string;
}
