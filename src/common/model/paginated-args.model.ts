import { ObjectType, Args, Int, ArgsType, Field } from "@nestjs/graphql"
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from "../constants"
import { ISuccessResponse, MembershipStatus } from "../types"
import { Type } from '@nestjs/common';

// 'limit', {
//     description: 'The maximum number of items to return',
//     type: () => Int,
//     defaultValue: DEFAULT_PAGE_LIMIT
// }

// @ArgsType()
// export class PaginatedArgs<T>(classRef: Type<T>) {
//     @Field(() => Int, { name: "limit", description: 'The maximum number of items to return'})
//     limit: number = DEFAULT_PAGE_LIMIT;

//     @Field(() => Int, { name: 'offset', description: 'The index of the first item to return.'})
//     offset: number = DEFAULT_PAGE_OFFSET;

//     @Field((type) => [classRef], { name: 'status', description: 'The status of the membership' })
//     status: T = null;
// }