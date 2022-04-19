import { createConnection } from "typeorm";
import path from "path";
import { environment } from "./environment";
import { Book } from "../entity/book.entity";
import { cronEvent } from "../admin/report";

export async function connect() {
  await createConnection({
    type: "postgres",
    port: Number(environment.DB_PORT),
    username: environment.DB_USERNAME,
    password: environment.DB_PASSWORD,
    database: environment.DB_DATABASE,
    entities: [path.join(__dirname, "../entity/**/**.ts")],
    synchronize: true,
  })
    .then(async (connection) => {
      const books = await Book.find({
        select: [
          "id",
          "title",
          "author",
          "isOnLoan",
          "user",
          "loanDay",
          "returnDay",
        ],
        relations: ["user", "author"],
        where: { isOnLoan: true },
      });
      cronEvent(books);
    })
    .catch((error) => console.log(error));
  console.log("Database running");
}
