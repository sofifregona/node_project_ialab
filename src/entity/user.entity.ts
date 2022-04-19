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
  export class User{
    @Field()
    @PrimaryGeneratedColumn() //Hace que el número sea autoincrementable
    id!: number;
  
    @Field()
    @Column()
    fullName!: string;
  
    @Field()
    @Column()
    email!: string;

    @Field()
    @Column()
    password!: string;

    @Field(() => [Book], { nullable: true })
    @OneToMany(() => Book, (book) => book.user, { nullable: true })
    borrowedBooks!: Book[];

    @Field({ nullable: true })
    @Column({ nullable: true })
    NumberBorrowedBooks!: number;
  
    @Field()
    @CreateDateColumn({ type: "timestamp" })
    createdAt!: string;
  }
  