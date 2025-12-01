import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * CheckoutSession - Entidad para almacenar datos temporales del carrito antes de Stripe
 * Persistencia temporal para el flujo de Stripe Checkout
 */
@Entity('checkout_sessions')
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'stripe_session_id', type: 'varchar', nullable: true })
  stripeSessionId: string | null;

  @Column({ name: 'cart_data', type: 'jsonb' })
  cartData: {
    items: Array<{
      productId: number;
      quantity: number;
      price: number;
    }>;
    total: number;
  };

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, string | number | boolean> | null;

  @Column({ name: 'status', type: 'varchar', default: 'pending' })
  @Index() // Índice para filtrar por estado
  status: 'pending' | 'completed' | 'expired';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    name: 'expires_at',
    type: 'timestamp',
    default: () => "NOW() + INTERVAL '1 hour'",
  })
  @Index() // Índice para queries de cleanup de sesiones expiradas
  expiresAt: Date;
}
