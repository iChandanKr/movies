const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required field"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required field"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required field"],
    },
    ratings: {
      type: Number,
      validate: {
      validator:  function(value) {
          return value >= 1 && value <= 10;
        },
        message:"Ratings ({VALUE}) should be in between 1 and 10"
      },
    },
    totalRating: {
      type: Number,
    },
    releaseYear: {
      type: Number,
      required: [true, "Release year is required field!"],
    },
    releaseDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    genres: {
      type: [String],
      required: [true, "Genres is required field!"],
    },
    directors: {
      type: [String],
      required: [true, "Directors is required field!"],
    },
    coverImage: {
      type: String,
      required: [true, "Cover image is required field!"],
    },
    actors: {
      type: [String],
      required: [true, "actors is required field!"],
    },
    price: {
      type: Number,
      required: [true, "Price is required field!"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

movieSchema.virtual("durationInHours").get(function () {
  return this.duration / 60;
});

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
