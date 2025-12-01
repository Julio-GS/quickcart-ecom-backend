// Domain Entities Export
// Adaptadas exactamente al esquema PostgreSQL existente

import { User } from './user.entity';
import { Product } from './product.entity';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CheckoutSession } from './checkout-session.entity';

export { BaseEntity } from './base.entity';
export { User, UserRole } from './user.entity';
export { Product } from './product.entity';
export { Order, OrderStatus } from './order.entity';
export { OrderItem } from './order-item.entity';
export { CheckoutSession } from './checkout-session.entity';

// Array of all entities for TypeORM configuration
export const entities = [User, Product, Order, OrderItem, CheckoutSession];
