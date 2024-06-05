import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma, User, Membership } from '@prisma/client';
import { CreateMembershipInput } from './inputs';

@Injectable()
export class MembershipService {
    constructor(private readonly prismaService: PrismaService) { }

    async create(data: CreateMembershipInput, creatorId: number): Promise<Membership> { 
        const { quantity, ...membership } = data;
        return this.prismaService.membership.create({
            data: {
                ...membership,
                creator: { connect: { id: creatorId }, },
                owner: { connect: { id: creatorId }, },
            }
        });
    }

    async createMany(data: CreateMembershipInput, creatorId: number): Promise<Membership[]> { 
        return Promise.all(Array.from({ length: data.quantity }, async (_, id) => {
            const { quantity, ...membership } = data;
            return this.prismaService.membership.create({
                data: {
                    ...membership,
                    name: `${membership.name} #${id + 1}`,
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
}
