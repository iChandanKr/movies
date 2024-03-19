const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("unhandled rejection occured! Shutting down...");
  process.exit(1);
});

const app = require("./app");
const dbConnection = require("./config/dbConnection");
const Movie = require("./model/movieModel");
// console.log(app.get('env'));
// console.log(process.env);

dbConnection();
const testMovie = new Movie({
  name: "War1",
  description:
    "War film is a film genre concerned with warfare, typically about naval, air, or land battles, with combat scenes central to the drama.",
  duration: 150,
  ratings: 4.8,
});

// testMovie.save().then((doc)=>{
//   console.log(doc);
// }).catch((err)=>{
//   console.log(err);
// })
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log("server is listening on port 3000...");
});

// -------- handling the unhandled rejections --------
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("unhandled rejection occured! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});


