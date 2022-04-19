export const cronEvent = (books: any) => {
  var cron = require("node-cron");

  cron.schedule("* * * * * Monday", () => {
    console.log("Weekly loan books report: ");
    console.log(books);
  });
};
