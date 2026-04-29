import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { SearchResult} from './search-result.entity';

@Entity('comparisons')
export class Comparison {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  winner!: string;

  @Column({ nullable: true })
  winnerPrice!: string;

  @OneToMany(() => SearchResult, result => result.comparison, { cascade: true })
  results!: SearchResult[];

  @CreateDateColumn()
  createdAt!: Date;
}