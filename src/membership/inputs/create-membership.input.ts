import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IMembership } from '../types';

@InputType({ description: 'The data fields required to create a membership.' })
export class CreateMembershipInput {

  @Field(() => String, { description: 'The unique identifier of the membership.' })
  name: string;

  @Field(() => String, { description: 'An identifier to group collection of membership.' })
  collectionTag?: string;

  @Field(() => String, { description: 'The description of the membership.' })
  description: string;

  @Field(() => Float, { description: 'The price of the membership.' })
  price: number;

  @Field(() => Int, { description: 'The quantity of this type of membership to create.' })
  quantity: number;
}
