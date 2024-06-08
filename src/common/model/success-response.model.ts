import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ISuccessResponse } from '../types';
import { HttpStatus, Type } from '@nestjs/common';


export function SuccessResponseModel<T>(classRef: Type<T>, isArray: boolean = false): Type<ISuccessResponse<T>> {
  @ObjectType({
    isAbstract: true,
    description:
      'A response model, containing the state of the response from the server.',
  })
  abstract class SuccessResponseType<T> implements ISuccessResponse<T> {
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

    @Field((type) => (isArray ? [classRef] : classRef), { nullable: true, description: 'Additional data returned from the server.' })
    data?: T;
  }
  return SuccessResponseType as Type<ISuccessResponse<T>>;
}