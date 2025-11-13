import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';

export enum UserRole {
  ADMIN = 'Admin',
  CLIENT = 'Client',
}

/**
 * User Entity - Usuarios del sistema (Admin y Clientes)
 * Tabla separada de Supabase auth para evitar conflictos
 * Implementa RBAC (Role-Based Access Control) para OWASP A01: Broken Access Control
 */
@Entity('app_users') // Cambiado de 'users' a 'app_users'
@Index(['email']) // Optimización para login
export class User extends BaseEntity {
  @Column({
    type: 'text',
    unique: true,
    nullable: false,
  })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'text',
    nullable: false,
    select: false, // Security: Never select password in queries by default
  })
  passwordHash: string;

  @Column({
    name: 'full_name',
    type: 'text',
    nullable: true,
  })
  fullName: string;

  @Column({
    type: 'text',
    nullable: false,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({
    type: 'text',
    nullable: true,
  })
  phone?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  address?: string;

  // Relations
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  // Virtual field for password (never stored, used for DTOs)
  password?: string;
}
