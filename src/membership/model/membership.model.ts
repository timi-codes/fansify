import { IMembership } from '../types';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { UserModel } from 'src/common';

@ObjectType({ description: 'A data model representing a membership' })
export class MembershipModel implements IMembership {

  @Field(() => Int, { description: 'The ID of the membership.' })
  id: number;

  @Field(() => String, { description: 'The description of the membership.' })
  name: string;

  @Field(() => String, { description: 'The description of the membership.' })
  description: string;

  @Field(() => Float, { description: 'The price of the membership.' })
  price: number;

  @Field(() => Date, { description: 'The date the user was created.' })
  updatedAt: Date;

  @Field(() => Date, { description: 'The date the user was created.' })
  createdAt: Date;

  @Field(() => UserModel, { description: 'The owner of the membership' })
  owner?: UserModel;

  @Field(() => UserModel, { description: 'The  creator of the membership' })
  creator?: UserModel;
}
