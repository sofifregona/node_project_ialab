import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  BaseEntity,
} from "typeorm";
import { Book } from "./book.entity";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Author{
    
  @Field()
  @PrimaryGeneratedColumn() //Hace que el número sea autoincrementable
  id!: number;

  @Field(() => String)
  @Column()
  fullName!: string;

  @Field(() => [Book], { nullable: true })
  @OneToMany(() => Book, (book) => book.author, { nullable: true })
  books!: Book[];

  @Field(() => String)
  @CreateDateColumn({ type: "timestamp" })
  createdAt!: string;
}
