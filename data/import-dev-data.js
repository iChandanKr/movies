const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const Movie = require("../model/movieModel");

// ----READING THE DATA --------------
const data = JSON.parse(fs.readFileSync("./data/sample.json", "utf-8"));
// console.log(data);

dotenv.config({ path: "./config.env" });
console.log(process.env.CONN_STRING);

//----------------- CONNECTION TO DATABASE ------------------
mongoose
  .connect(process.env.CONN_STRING)
  .then((conn) => {
    // console.log(conn);
    console.log("database is connected");
  })
  .catch((err) => {
    console.log(err);
  });

//------------------- DELETING THE EXISTING DATA FROM DATABASE----------

const deleteMovies = async (req, res) => {
  try {
    await Movie.deleteMany();
    console.log("movies deleted successfully..");
  } catch (error) {
    console.log(error.message);
  }
  process.exit();
};

// ------------- IMPORTING FILE TO DATABASE ---------------
const createMovies = async (req, res) => {
  try {
    const movies = Movie.create(data);
    console.log("movies created successfylly.");
  } catch (error) {
    console.log(error.message);
  }
};

if (process.argv[2] === "--delete") {
  deleteMovies();
}

if (process.argv[2] === "--import") {
  createMovies();
}
