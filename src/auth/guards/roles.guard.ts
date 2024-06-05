import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Roles } from '../../common/decorators';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common';
import { GqlExecutionContext } from '@nestjs/graphql';

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
        return role === user.role;
    }
}