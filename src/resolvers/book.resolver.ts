import { Mutation, Resolver, Arg, InputType, Field, Query, UseMiddleware, Ctx } from "type-graphql";
import { getRepository, Repository } from "typeorm";
import { Length } from "class-validator";
import { Book } from "../entity/book.entity";
import { Author } from "../entity/author.entity";
import { IContext, isAuth } from "../middlewars/auth.middleware";

// INPUT TYPES

@InputType()
class BookInput {
  @Field()
  @Length(3, 64)
  title!: string;

  @Field()
  author!: number;
}

@InputType()
class BookUpdateInput {
  @Field(() => String, { nullable: true })
  @Length(3, 64)
  title?: string;

  @Field(() => Number, { nullable: true })
  author?: number;
}

@InputType()
class BookUpdateParseInput {
  @Field(() => String, { nullable: true })
  @Length(3, 64)
  title?: string;

  @Field(() => Author, { nullable: true })
  author?: Author;
}

@InputType()
class BookIdInput {
  @Field(() => Number)
  id!: number;
}

// RESOLVER

@Resolver()
export class BookResolver {
  // REPOSITORIES

  bookRepository: Repository<Book>;
  authorRepository: Repository<Author>;

  // CONSTRUCTOR

  constructor() {
    this.bookRepository = getRepository(Book);
    this.authorRepository = getRepository(Author);
  }

  // MUTATIONS

  @Mutation(() => Book)
  @UseMiddleware(isAuth)
  async createBook(@Arg("input", () => BookInput) input: BookInput, @Ctx() context: IContext) {
    const author: Author | undefined = await this.authorRepository.findOne(
      input.author
    );
    if (!author) {
      throw new Error(
        "The author for this book does not exist, please double check"
      );
    }
    const book = await this.bookRepository.insert({
      title: input.title,
      author: author,
    });
    return await this.bookRepository.findOne(book.identifiers[0].id, {
      relations: ["author", "author.books"],
    });
  }

  @Mutation(() => Boolean)
  async updateBookId(
    @Arg("bookId", () => BookIdInput) bookId: BookIdInput,
    @Arg("input", () => BookUpdateInput) input: BookUpdateInput
  ): Promise<Boolean> {
    await this.bookRepository.update(bookId.id, await this.parseInput(input));
    return true;
  }

  @Mutation(() => Boolean)
  async deleteBook(
    @Arg("bookId", () => BookIdInput) bookId: BookIdInput
  ): Promise<Boolean> {
    const book = await this.bookRepository.findOne(bookId.id, {
      relations: ["author", "author.books"],
    });
    if (!book) {
      throw new Error("Book not found");
    }
    await this.bookRepository.delete(bookId.id);
    return true;
  }

  // QUERYS

  @Query(() => [Book])
  @UseMiddleware(isAuth)
  async getAllBooks(): Promise<Book[]> {
    return await this.bookRepository.find({
      relations: ["author", "author.books"],
    });
  }

  @Query(() => Book)
  async getBookById(
    @Arg("input", () => BookIdInput) input: BookIdInput
  ): Promise<Book | undefined> {
    const book = await this.bookRepository.findOne(input.id, {
      relations: ["author", "author.books"],
    });
    if (!book) {
      throw new Error("Book not found");
    }
    return book;
  }

  private async parseInput(input: BookUpdateInput) {
    const _input: BookUpdateParseInput = {};
    if (input.title) {
      _input["title"] = input.title;
    }
    if (input.author) {
      const author = await this.authorRepository.findOne(input.author);
      if (!author) {
        throw new Error("This author does not exist");
      }
      _input["author"] = await this.authorRepository.findOne(input.author);
    }
    return _input;
  }
}
