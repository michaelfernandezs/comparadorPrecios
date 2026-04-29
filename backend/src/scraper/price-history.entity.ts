import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { TrackedProduct } from './tracked-product.entity';

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => TrackedProduct, product => product.priceHistory)
  trackedProduct!: TrackedProduct;

  @Column()
  price!: string;

  @CreateDateColumn()
  recordedAt!: Date;
}