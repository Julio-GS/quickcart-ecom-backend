import {
  Entity,
  Column,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

/**
 * Product Entity - Catálogo de productos
 * Coincide exactamente con el esquema PostgreSQL existente
 * Incluye optimizaciones para filtros dinámicos y performance frontend
 */
@Entity('products')
@Index('idx_products_category_name', ['category', 'name']) // Índice para búsquedas y filtros
export class Product {
  @PrimaryGeneratedColumn('increment') // SERIAL PRIMARY KEY
  id: number;

  @Column({
    type: 'text',
    nullable: false,
  })
  name: string;

  @Column({
    type: 'text',
    unique: true,
    nullable: false,
  })
  slug: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @Column({
    type: 'integer',
    nullable: false,
  })
  stock: number;

  @Column({
    type: 'text',
    nullable: false,
  })
  category: string;

  @Column({
    name: 'image_url',
    type: 'text',
    nullable: true,
  })
  imageUrl: string;

  @Column({
    name: 'is_featured',
    type: 'boolean',
    default: false,
  })
  isFeatured: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // Relations
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  // Virtual properties
  get isInStock(): boolean {
    return this.stock > 0;
  }

  get isLowStock(): boolean {
    return this.stock <= 5; // Considerar bajo stock cuando <= 5
  }

  // Helper methods
  updateStock(quantity: number): void {
    this.stock = Math.max(0, this.stock + quantity);
  }

  reduceStock(quantity: number): boolean {
    if (this.stock >= quantity) {
      this.stock -= quantity;
      return true;
    }
    return false;
  }
}
