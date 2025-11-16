import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

/**
 * OrderItem Entity - Ítems individuales de un pedido
 * Coincide exactamente con el esquema PostgreSQL existente
 * Tabla de relación N:M (Pedido:Producto) con detalles de transacción
 */
@Entity('order_items')
@Unique(['orderId', 'productId'])
export class OrderItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Order, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({
    name: 'order_id',
    type: 'uuid',
    nullable: false,
  })
  orderId: string;

  @ManyToOne(() => Product, (product) => product.orderItems, {
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    name: 'product_id',
    type: 'integer',
    nullable: false,
  })
  productId: number;

  @Column({
    type: 'integer',
    nullable: false,
  })
  quantity: number;

  @Column({
    name: 'price_at_purchase',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  priceAtPurchase: number;

  // Business logic methods
  getTotalPrice(): number {
    return this.priceAtPurchase * this.quantity;
  }

  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    this.quantity = newQuantity;
  }
}
