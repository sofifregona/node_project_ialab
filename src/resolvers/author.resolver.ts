import {
  Mutation,
  Resolver,
  Arg,
  InputType,
  Field,
  Query,
  UseMiddleware,
  Ctx,
} from "type-graphql";
import { getRepository, Repository } from "typeorm";
import { Length } from "class-validator";
import { Author } from "../entity/author.entity";
import { IContext, isAuth } from "../middlewars/auth.middleware";

// INPUT TYPES
@InputType()
class AuthorFullNameInput {
  @Field()
  @Length(3, 64)
  fullName!: string;
}

@InputType()
class AuthorByIdInput {
  @Field(() => Number)
  authorId!: number;
}

@InputType()
class AuthorByFullNameInput {
  @Field(() => String)
  fullName!: string;
}

@InputType()
class AuthorUpdateInput {
  @Field(() => Number)
  authorId!: number; //! significa que es obligatorio

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
  @UseMiddleware(isAuth)
  async createAuthor(
    @Arg("input", () => AuthorFullNameInput) input: AuthorFullNameInput,
    @Ctx() context: IContext
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
  @UseMiddleware(isAuth)
  async updateAuthorById(
    @Arg("input", () => AuthorUpdateInput) input: AuthorUpdateInput,
    @Ctx() context: IContext
  ): Promise<Author | undefined> {
    try {
      const authorExist = await this.authorRepository.findOne(input.authorId);
      if (!authorExist) {
        const error = new Error();
        error.message = "Author does not exists";
        throw error;
      }
      const updatedAuthor = await this.authorRepository.save({
        id: input.authorId,
        fullName: input.fullName,
      });
      return await this.authorRepository.findOne(updatedAuthor.id);
    } catch (e: any) {
      throw new Error(e);
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteAuthorById(
    @Arg("input", () => AuthorByIdInput) input: AuthorByIdInput,
    @Ctx() context: IContext
  ): Promise<Boolean> {
    try {
      const authorExist = await this.authorRepository.findOne(input.authorId);
      if (!authorExist) {
        const error = new Error();
        error.message = "Author does not exists";
        throw error;
      }
      await this.authorRepository.delete(input.authorId);
      return true;
    } catch (e: any) {
      throw new Error(e);
    }
  }

  // QUERYS

  @Query(() => [Author])
  @UseMiddleware(isAuth)
  async getAllAuthors(@Ctx() context: IContext): Promise<Author[]> {
    return await this.authorRepository.find({
      relations: ["books", "books.user"],
    }); //Find devuelve un array con los objetos
  }

  @Query(() => Author)
  async getAuthorById(
    @Arg("input", () => AuthorByIdInput) input: AuthorByIdInput,
    @Ctx() context: IContext
  ): Promise<Author | undefined> {
    try {
      console.log("input:", input);
      const author = await this.authorRepository.findOne(input.authorId, {
        relations: ["books", "books.user"],
      }); //FindOne devuelve un sólo objeto
      console.log("authorRepository:", this.authorRepository);
      if (!author) {
        const error = new Error();
        error.message = "Author does not exists";
        throw error;
      }
      return author;
    } catch (e: any) {
      throw new Error(e);
    }
  }

  @Query(() => Author)
  @UseMiddleware(isAuth)
  async getAuthorByFullName(
    @Arg("input", () => AuthorByFullNameInput) input: AuthorByFullNameInput,
    @Ctx() context: IContext
  ): Promise<Author | undefined> {
    try {
      const author = await this.authorRepository.findOne({
        where: { fullName: input.fullName },
        relations: ["books", "books.user"],
      }); //FindOne devuelve un sólo objeto
      if (!author) {
        const error = new Error();
        error.message = "Author does not exists";
        throw error;
      }
      return author;
    } catch (e: any) {
      throw new Error(e);
    }
  }
}
