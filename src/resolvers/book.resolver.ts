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
import { IContext, isAuth } from "../middlewars/auth.middleware";
import { Length } from "class-validator";
import { Book } from "../entity/book.entity";
import { Author } from "../entity/author.entity";
import { User } from "../entity/user.entity";

// INPUT TYPES

@InputType()
class BookInput {
  @Field()
  @Length(3, 64)
  title!: string;

  @Field()
  authorId!: number;
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
class BookUpdateParsedInput {
  @Field(() => String, { nullable: true })
  @Length(3, 64)
  title?: string;

  @Field(() => Author, { nullable: true })
  author?: Author;
}

@InputType()
class BookBorrowInput {
  @Field(() => Number)
  bookId!: number;

  @Field()
  userId!: number;
}

@InputType()
class BookByIdInput {
  @Field(() => Number)
  bookId!: number;
}

@InputType()
class BookByTitleInput {
  @Field(() => String)
  title!: string;
}

@InputType()
class BookByAuthorIdInput {
  @Field(() => Number)
  authorId!: number;
}

// RESOLVER

@Resolver()
export class BookResolver {
  // REPOSITORIES

  bookRepository: Repository<Book>;
  authorRepository: Repository<Author>;
  userRepository: Repository<User>;

  // CONSTRUCTOR

  constructor() {
    this.bookRepository = getRepository(Book);
    this.authorRepository = getRepository(Author);
    this.userRepository = getRepository(User);
  }

  // MUTATIONS

  @Mutation(() => Book)
  @UseMiddleware(isAuth)
  async createBook(
    @Arg("input", () => BookInput) input: BookInput,
    @Ctx() context: IContext
  ) {
    try {
      const author: Author | undefined = await this.authorRepository.findOne(
        input.authorId
      );
      if (!author) {
        const error = new Error();
        error.message =
          "The author for this book does not exist, please double check";
        throw error;
      }
      const book = await this.bookRepository.insert({
        title: input.title,
        author: author,
        isOnLoan: false,
        loanDay: "",
        returnDay: "",
      });
      return await this.bookRepository.findOne(book.identifiers[0].id, {
        relations: ["author", "author.books", "user", "user.borrowedBooks"],
      });
    } catch (e: any) {
      throw new Error(e);
    }
  }

  @Mutation(() => Book)
  @UseMiddleware(isAuth)
  async updateBookById(
    @Arg("bookInput", () => BookByIdInput) bookInput: BookByIdInput,
    @Arg("updateInput", () => BookUpdateInput) updateInput: BookUpdateInput,
    @Ctx() context: IContext
  ): Promise<Book | undefined> {
    try {
      const book = await this.bookRepository.findOne(bookInput.bookId);
      if (!book) {
        const error = new Error();
        error.message = "The book does not exist";
        throw error;
      }
      await this.bookRepository.update(
        bookInput.bookId,
        await this.parseInput(updateInput)
      );
      return await this.bookRepository.findOne(bookInput.bookId, {
        relations: ["author", "author.books", "user", "user.borrowedBooks"],
      });
    } catch (e: any) {
      throw new Error(e);
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteBook(
    @Arg("input", () => BookByIdInput) input: BookByIdInput,
    @Ctx() context: IContext
  ): Promise<Boolean> {
    try {
      const book = await this.bookRepository.findOne(input.bookId, {
        relations: ["author", "author.books", "user", "user.borrowedBooks"],
      });
      if (!book) {
        const error = new Error();
        error.message = "Book not found";
        throw error;
      }
      await this.bookRepository.delete(input.bookId);
      return true;
    } catch (e: any) {
      throw new Error(e);
    }
  }

  @Mutation(() => Book)
  @UseMiddleware(isAuth)
  async borrowBook(
    @Arg("input", () => BookBorrowInput) input: BookBorrowInput,
    @Ctx() context: IContext
  ) {
    try {
      const user: User | undefined = await this.userRepository.findOne(
        input.userId
      );
      if (!user) {
        const error = new Error();
        error.message = "The user does not exist";
        throw error;
      }

      const book: Book | undefined = await this.bookRepository.findOne(
        input.bookId
      );
      if (!book) {
        const error = new Error();
        error.message = "The book does not exist";
        throw error;
      }
      if (book.isOnLoan) {
        const error = new Error();
        error.message = "The book is on loan";
        throw error;
      }

      let numberborrowedbooks = user.NumberBorrowedBooks;
      if (numberborrowedbooks === undefined) numberborrowedbooks = 0;
      if (numberborrowedbooks < 3) {
        numberborrowedbooks = numberborrowedbooks + 1;
      } else {
        const error = new Error();
        error.message = "You can't borrow more than three books at the same time";
        throw error;
      }

      const updateUser = await this.userRepository.update(input.userId, {
        NumberBorrowedBooks: numberborrowedbooks,
      });

      const loanDayy = new Date();
      const loanDayy_toString = loanDayy.getFullYear()+"/"+loanDayy.getMonth()+"/"+loanDayy.getDay();
      let returnDayy = new Date();
      returnDayy.setDate(returnDayy.getDate() + 7);
      const returnDayy_toString = returnDayy.getFullYear()+"/"+returnDayy.getMonth()+"/"+returnDayy.getDay();


      const updatedBook = await this.bookRepository.save({
        id: input.bookId,
        isOnLoan: true,
        user: user,
        loanDay: loanDayy_toString,
        returnDay: returnDayy_toString,
      });

      return await this.bookRepository.findOne(input.bookId, {
        relations: ["author", "author.books", "user", "user.borrowedBooks"],
      });
      
    } catch (e: any) {
      throw new Error(e);
    }
  }

  @Mutation(() => Book)
  @UseMiddleware(isAuth)
  async returnBook(
    @Arg("input", () => BookBorrowInput) input: BookBorrowInput,
    @Ctx() context: IContext
  ) {
    try {
      const user: User | undefined = await this.userRepository.findOne(
        input.userId
      );
      if (!user) {
        const error = new Error();
        error.message = "The user does not exist";
        throw error;
      }
      if (
        user.NumberBorrowedBooks === 0 ||
        user.NumberBorrowedBooks === undefined
      ) {
        const error = new Error();
        error.message = "You have not borrow any book";
        throw error;
      }

      const book: Book | undefined = await this.bookRepository.findOne(
        input.bookId
      );
      if (!book) {
        const error = new Error();
        error.message = "The book does not exist";
        throw error;
      }

      const bookBorrowedByUser: Book | undefined = await this.bookRepository.findOne({
        where: { user: input.userId },
      });
      if (!bookBorrowedByUser) {
        const error = new Error();
        error.message = "You have not borrow this book";
        throw error;
      }

      let numberborrowedbooks = user.NumberBorrowedBooks;
      numberborrowedbooks = numberborrowedbooks - 1;

      const updateUser = await this.userRepository.update(input.userId, {
        NumberBorrowedBooks: numberborrowedbooks,
      });

      const currentDate = new Date();
      const currentDate_toNumber = currentDate.getFullYear()+""+currentDate.getMonth()+""+currentDate.getDay();
      const returnDayy_toNumber = book.returnDay.replace("/","").replace("/","");
      const diff = parseInt(currentDate_toNumber) - parseInt(returnDayy_toNumber);

      const updatedBook = await this.bookRepository.save({
        id: input.bookId,
        isOnLoan: false,
        user: null,
        loanDay: "",
        returnDay: "",
      });

      if(diff > 7){
        const error = new Error();
        error.message = "It's been more than 7 days, you must pay a fine";
        throw error;
      }

      return await this.bookRepository.findOne(updatedBook.id, {
      relations: ["author", "author.books", "user", "user.borrowedBooks"],
      });
      // return true;
    } catch (e: any) {
      throw new Error(e);
    }
  }

  // QUERYS

  @Query(() => [Book])
  @UseMiddleware(isAuth)
  async getAllBooks(
    @Ctx() context: IContext
  ): Promise<Book[]> {
    return await this.bookRepository.find({
      relations: ["author", "author.books", "user", "user.borrowedBooks"],
    });
  }

  @Query(() => [Book])
  @UseMiddleware(isAuth)
  async getOnlyAvaibleBooks(
    @Ctx() context: IContext
  ): Promise<Book[]> {
    return await this.bookRepository.find({ where: { isOnLoan: false},
      relations: ["author", "author.books", "user", "user.borrowedBooks"],
    });
  }

  @Query(() => Book)
  @UseMiddleware(isAuth)
  async getBookById(
    @Arg("input", () => BookByIdInput) input: BookByIdInput,
    @Ctx() context: IContext
  ): Promise<Book | undefined> {
    try {
      const book = await this.bookRepository.findOne(input.bookId, {
        relations: ["author", "author.books", "user", "user.borrowedBooks"],
      });
      if (!book) {
        const error = new Error();
        error.message = "Book not found";
        throw error;
      }
      return book;
    } catch (e: any) {
      throw new Error(e);
    }
  }

  @Query(() => Book)
  @UseMiddleware(isAuth)
  async getBookByTitle(
    @Arg("input", () => BookByTitleInput) input: BookByTitleInput,
    @Ctx() context: IContext
  ): Promise<Book | undefined> {
    try {
      const book = await this.bookRepository.findOne({
        where: { title: input.title },
        relations: ["author", "author.books", "user", "user.borrowedBooks"],
      });
      if (!book) {
        const error = new Error();
        error.message = "Book not found";
        throw error;
      }
      return book;
    } catch (e: any) {
      throw new Error(e);
    }
  }

  @Query(() => [Book])
  @UseMiddleware(isAuth)
  async getBooksByAuthorId(
    @Arg("input", () => BookByAuthorIdInput) input: BookByAuthorIdInput,
    @Ctx() context: IContext
  ): Promise<Book[] | undefined> {
    try {
      const author = await this.authorRepository.findOne(input.authorId);
      if(!author){
        const error = new Error();
        error.message = "Author not found";
        throw error;
      }
      const books = await this.bookRepository.find({
        where: { author: input.authorId },
        relations: ["author", "author.books", "user", "user.borrowedBooks"],
      });
      if (!books) {
        const error = new Error();
        error.message = "No books registered for this author";
        throw error;
      }
      return books;
    } catch (e: any) {
      throw new Error(e);
    }
  }

  private async parseInput(input: BookUpdateInput) {
    try {
      const _input: BookUpdateParsedInput = {};
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
    } catch (e: any) {
      throw new Error(e);
    }
  }
}
