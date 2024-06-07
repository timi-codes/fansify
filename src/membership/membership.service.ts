import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma, User, Membership } from '@prisma/client';
import { CreateMembershipInput } from './inputs';
import { IPaginationOptions, MembershipWithInclude } from 'src/common';

@Injectable()
export class MembershipService {
    constructor(private readonly prismaService: PrismaService) { }

    async createMany(data: CreateMembershipInput, creatorId: number, trxHash: string): Promise<Membership[]> { 
        return Promise.all(Array.from({ length: data.quantity }, async (_, id) => {
            const { quantity, ...membership } = data;
            return this.prismaService.membership.create({
                data: {
                    ...membership,
                    trxHash,
                    creator: { connect: { id: creatorId }, },
                    owner: { connect: { id: creatorId }, },
                }
            })
        }));
    }

    /**
     * Find one user.
     *
     * @param where the options to use to filter the search:
     */
    async findOne(where?: Prisma.MembershipWhereInput, include?: Prisma.MembershipInclude): Promise<MembershipWithInclude> {
        return this.prismaService.membership.findFirst({ where, include });
    }

    /**
 * Get all the membership records.
 *
 * @param where the where clause options
 * @param orderBy the options used to order the data
 * @param data the data to update
 */
    async findMany(
        { limit, offset }: IPaginationOptions,
        orderBy?: Prisma.MembershipOrderByWithRelationInput,
        where?: Prisma.MembershipWhereInput,
    ) {
        return this.prismaService.membership.findMany({
            skip: offset,
            take: limit,
            where,
            orderBy,
        });
    }

    /**
     * Get a count of membership records.
     *
     * @param where the where clause options
     */
    async count(where?: Prisma.MembershipWhereInput) {
        return this.prismaService.membership.count({
            where,
        });
    }

    async tagExists(tag: string): Promise<Boolean> { 
        const memberships = await this.prismaService.membership.findMany({
            where: { collectionTag: tag }
        });
        return memberships.length > 0 ? true : false;
    }

    async findByIds(ids: number[], include?: Prisma.MembershipInclude): Promise<MembershipWithInclude[]> {
        return this.prismaService.membership.findMany({
            where: { id: { in: ids } },
            include
        });
    }

    /**
     * Update the membership record.
     *
     * @param where the where clause options
     * @param data the data to update
     */
    async update(
        where: Prisma.MembershipWhereUniqueInput,
        data: Prisma.MembershipUpdateInput,
    ) {
        return this.prismaService.membership.update({
            where,
            data,
        });
    }
}
