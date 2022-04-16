import { Mutation, Resolver, Arg, InputType, Field, Query } from "type-graphql";
import { getRepository, Repository } from "typeorm";
import { Length } from "class-validator";
import { Author } from "../entity/author.entity";

// INPUT TYPES

@InputType()
class AuthorFullNameInput {
  @Field()
  @Length(3, 64)
  fullName!: string;
}

@InputType()
class AuthorIdInput {
  @Field(() => Number)
  id!: number;
}

@InputType()
class AuthorUpdateInput {
  @Field(() => Number)
  id!: number; //! significa que es obligatorio

  @Field()
  @Length(3, 64)
  fullName?: string; //? significa que es opcional
}

// RESOLVER

@Resolver()
export class AuthorResolver {
  // REPOSITORY

  authorRepository: Repository<Author>;

  // CONSTRUCTOR

  constructor() {
    this.authorRepository = getRepository(Author);
  }

  // MUTATIONS

  @Mutation(() => Author)
  async createAuthor(
    @Arg("input", () => AuthorFullNameInput) input: AuthorFullNameInput
  ): Promise<Author | undefined> {
    try {
      const createdAuthor = await this.authorRepository.insert({
        fullName: input.fullName,
      });
      const result = await this.authorRepository.findOne(
        createdAuthor.identifiers[0].id
      );
      return result;
    } catch {
      console.error;
    }
  }

  @Mutation(() => Author)
  async updateOneAuthor(
    @Arg("input", () => AuthorUpdateInput) input: AuthorUpdateInput
  ): Promise<Author | undefined> {
    const authorExist = await this.authorRepository.findOne(input.id);
    if (!authorExist) {
      throw new Error("Author does not exists");
    }
    const updatedAuthor = await this.authorRepository.save({
      id: input.id,
      fullName: input.fullName,
    });
    return await this.authorRepository.findOne(updatedAuthor.id);
  }

  @Mutation(() => Boolean)
  async deleteOneAuthor(
    @Arg("input", () => AuthorIdInput) input: AuthorIdInput
  ): Promise<Boolean> {
    const authorExist = await this.authorRepository.findOne(input.id);
    if (!authorExist) {
      throw new Error("Author does not exists");
    }
    await this.authorRepository.delete(input.id);
    return true;
  }

  // QUERYS

  @Query(() => [Author])
  async getAllAuthors(): Promise<Author[]> {
    return await this.authorRepository.find({ relations: ["books"] }); //Find devuelve un array con los objetos
  }

  @Query(() => Author)
  async getOneAuthor(
    @Arg("input", () => AuthorIdInput) input: AuthorIdInput
  ): Promise<Author | undefined> {
    const author = await this.authorRepository.findOne(input.id); //FindOne devuelve un sólo objeto
    if (!author) {
      throw new Error("Author does not exists");
    }
    return author;
  }
}
