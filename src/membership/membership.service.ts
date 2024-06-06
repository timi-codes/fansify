import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma, User, Membership } from '@prisma/client';
import { CreateMembershipInput } from './inputs';

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
                    tag: `${membership.tag}-#${id + 1}`,
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
    async findOne(where?: Prisma.MembershipWhereInput): Promise<Membership> {
        return this.prismaService.membership.findFirst({ where });
    }

    async tagExists(tag: string): Promise<Boolean> { 
        const memberships = await this.prismaService.membership.findMany({
            where: {
                OR: [
                    { tag },
                    { tag: { contains: `${tag}-#` } },
                ],
            },
        });

        return memberships.length > 0 ? true : false;
    }
}
