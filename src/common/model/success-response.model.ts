import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ISuccessResponse } from '../types';
import { HttpStatus, Type } from '@nestjs/common';

@ObjectType({
  isAbstract: true,
  description:
    'A response model, containing the state of the response from the server.',
})
export abstract class SuccessResponseModel<T> implements ISuccessResponse<T> {
  @Field(() => Int, { description: 'The HTTP status of the response.' })
  statusCode?: HttpStatus;
  @Field(() => Boolean, {
    description: 'Determines whether the server action was successful.',
  })
  isSuccess: boolean;
  @Field(() => String, {
    description: 'Contextual message describing what happened.',
  })
  message: string;
  // @Field(() => Type, { nullable: true, description: 'Additional data returned from the server.' })
  data?: T;
}
