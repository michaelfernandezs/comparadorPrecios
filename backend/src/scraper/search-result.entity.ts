import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Comparison } from './comparison.entity';
import { TrackedProduct } from './tracked-product.entity';

@Entity('search_results')
export class SearchResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Comparison, comparison => comparison.results)
  comparison!: Comparison;

  @Column()
  store!: string;

  @Column()
  title!: string;

  @Column()
  price!: string;

  @Column({ nullable: true })
  image!: string;

  @Column()
  url!: string;

  @ManyToOne(() => TrackedProduct, { nullable: true, eager: true })
  trackedProduct?: TrackedProduct;

  @Column({ nullable: true })
  trackedProductId?: number;
}