import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('searches')
export class Search {
  @PrimaryGeneratedColumn()
  id!: number;

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

  @CreateDateColumn()
  createdAt!: Date;
}