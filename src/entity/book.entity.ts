import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  BaseEntity
} from "typeorm";
import { Author } from "./author.entity";
import { Field, ObjectType } from "type-graphql";
import { User } from "./user.entity";

@ObjectType()
@Entity("books")
export class Book extends BaseEntity{
  @Field()
  @PrimaryGeneratedColumn() //Hace que el número sea autoincrementable
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field(() => Author)
  @ManyToOne(() => Author, (author) => author.books, { onDelete: "CASCADE" }) // Elimina los libros relacionados con el autor y todas las relaciones
  author!: Author;

  @Field()
  @Column({ nullable: true })
  isOnLoan!: boolean;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.borrowedBooks, { nullable: true }) // Elimina los libros relacionados con el autor y todas las relaciones
  user!: User | null;

  @Field({ nullable: true })
  @Column({ nullable: true })
  loanDay!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  returnDay!: string;

  @Field()
  @CreateDateColumn({ type: "timestamp" })
  createdAt!: string;
}
