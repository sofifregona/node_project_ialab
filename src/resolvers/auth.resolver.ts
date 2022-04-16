import {
  Mutation,
  Resolver,
  Arg,
  InputType,
  Field,
  Query,
  ObjectType,
} from "type-graphql";
import { getRepository, Repository } from "typeorm";
import { Length, IsEmail } from "class-validator";
import { User } from "../entity/user.entity";
import { hash, compareSync } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { environment } from "../config/environment";


// INPUT TYPES

@InputType()
class UserInput {
  @Field()
  @Length(3, 64)
  fullName!: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @Length(8, 254)
  password!: string;
}

@InputType()
class LoginInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  password!: string;
}

// OBJECT TYPES

@ObjectType()
class LoginResponse {
  @Field()
  userId!: number;

  @Field()
  jwt!: string;
}

@Resolver()
export class AuthResolver {
  // REPOSITORY

  userRepository: Repository<User>;

  // CONSTRUCTOR

  constructor() {
    this.userRepository = getRepository(User);
  }

  // MUTATIONS

  @Mutation(() => User)
  async register(
    @Arg("input", () => UserInput) input: UserInput
  ): Promise<User | undefined> {
    const { fullName, email, password } = input;
    const userExists = await this.userRepository.findOne({ where: { email } });

    // Valida que el e-mail no esté en uso
    if (userExists) {
      throw new Error("Email is no available");
    }

    const hashedPassword = await hash(password, 10); // Encripta la contraseña
    const newUser = await this.userRepository.insert({
      fullName,
      email,
      password: hashedPassword,
    });
    return this.userRepository.findOne(newUser.identifiers[0].id);
  }

  @Mutation(() => LoginResponse)
  async login(@Arg("input", () => LoginInput) input: LoginInput) {
    const { email, password } = input;
    const userFound = await this.userRepository.findOne({ where: { email } });
    if (!userFound) {
      throw new Error("Invalid credentials");
    }
    const isValidPassword: boolean = compareSync(password, userFound.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }
    const jwt: string = sign({id: userFound.id}, environment.JWT_SECRET)
    return {
        userId: userFound.id,
        jwt: jwt,
    }
  }
}
