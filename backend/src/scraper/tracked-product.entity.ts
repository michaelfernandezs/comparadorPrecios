import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { PriceHistory } from './price-history.entity';

@Entity('tracked_products')
export class TrackedProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  store!: string;

  @Column()
  title!: string;

  @Column()
  url!: string;

  @Column({ nullable: true })
  image!: string;

  @Column({ nullable: true })
  currentPrice!: string;

  @OneToMany(() => PriceHistory, history => history.trackedProduct, { cascade: true })
  priceHistory!: PriceHistory[];

  @CreateDateColumn()
  createdAt!: Date;
}