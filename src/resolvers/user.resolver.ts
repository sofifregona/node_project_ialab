import {
  Mutation,
  Resolver,
  Arg,
  InputType,
  Field,
  Query,
  ObjectType,
  UseMiddleware,
  Ctx,
} from "type-graphql";
import { getRepository, Repository } from "typeorm";
import { User } from "../entity/user.entity";
import { Book } from "../entity/book.entity";
import { IContext, isAuth } from "../middlewars/auth.middleware";


// INPUT TYPES


@InputType()
class UserById {
  @Field(() => Number)
  id!: number;
}

// RESOLVER

@Resolver()
export class UserResolver {
  // REPOSITORIES

  bookRepository: Repository<Book>;
  userRepository: Repository<User>;

  // CONSTRUCTOR

  constructor() {
    this.bookRepository = getRepository(Book);
    this.userRepository = getRepository(User);
  }

  // QUERYS

  @Query(() => [User])
  @UseMiddleware(isAuth)
  async getAllUsers(
    @Ctx() context: IContext
  ): Promise<User[]> {
    return await this.userRepository.find({ relations: ["borrowedBooks", "borrowedBooks.author"] }); //Find devuelve un array con los objetos
  }

  @Query(() => User)
  @UseMiddleware(isAuth)
  async getOneUser(
    @Arg("input", () => UserById) input: UserById,
    @Ctx() context: IContext
  ): Promise<User | undefined> {
    const user = await this.userRepository.findOne(input.id, { relations: ["borrowedBooks", "borrowedBooks.author"] }); //FindOne devuelve un sólo objeto
    if (!user) {
      throw new Error("User does not exists");
    }
    return user;
  }
}
