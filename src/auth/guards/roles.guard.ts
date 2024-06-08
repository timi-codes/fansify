import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Roles } from '../../common/decorators';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLException } from '@nestjs/graphql/dist/exceptions';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const role = this.reflector.get<Role>(Roles, context.getHandler());
        if (!role) {
            return true;
        }

        const ctx = GqlExecutionContext.create(context);

        const request = ctx.getContext();
        const user = request.req.user;
        if (role != user.role) {
            throw new GraphQLException(
                'User doesn not have the right role to access this resource.',
                {
                    extensions: {
                        http: {
                            status: HttpStatus.FORBIDDEN,
                        },
                    },
                },
            );
        }
        return true
    }
}