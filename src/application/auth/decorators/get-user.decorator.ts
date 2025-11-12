import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador @GetUser - Extrae la información del usuario del request
 * Usado después de JwtAuthGuard para obtener el usuario autenticado
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@GetUser() user: any) {
 *   return user;
 * }
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('my-orders')
 * getMyOrders(@GetUser('id') userId: string) {
 *   return this.ordersService.findByUserId(userId);
 * }
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
