import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GraphQlAuthGuard extends AuthGuard('jwt') {
    getRequest(context: ExecutionContext) {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req;
        return request;
    }

  	async canActivate(context: ExecutionContext): Promise<boolean> {
		const result = await super.canActivate(context);
		
		if (result) {
			const ctx = GqlExecutionContext.create(context);
			const request = ctx.getContext().req;
			ctx.getContext().user = request.user;
		}
    
    	return result as boolean;
	}

	handleRequest(_: any, user: any) {
		return user || null;
	}
}