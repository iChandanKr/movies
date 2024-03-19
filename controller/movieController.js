const fs = require("fs");
const Movie = require("../model/movieModel");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/customError");
const ApiFeatures = require("../utils/ApiFeature");

// ########## FIND ALL MOVIES #############

const getAllMovies = asyncErrorHandler(async (req, res, next) => {
  const features = new ApiFeatures(Movie.find(),req.query).filter().sort().limitFields().paginate();
  
  
  //  --------- pagination ------------
  // let moviesCount = null;
  // if (req.query.page) {
  //   moviesCount = await Movie.countDocuments();
  // }
  

  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 4;
  // const skip = (page - 1) * limit;

  //----------- sorting -----------
  // let sort = null;
  // if (req.query.sort) {
  //   sort = req.query.sort.replace(/(,)/g, " ");
  // } else {
  //   sort = "-createdAt";
  // }

  // ----- fields ------
  // let fields = null;
  // if (req.query.fields) {
  //   fields = req.query.fields.replace(/(,)/g, " ");
  // } else {
  //   fields = "-__v";
  // }

  // const queryObj = { ...req.query }; //creating a shallow copy

  // const excludeFields = ["sort", "page", "limit", "fields"];

  // excludeFields.forEach((el) => {
  //   delete queryObj[el];
  //   // console.log(el);
  // });
  // let queryStr = JSON.stringify(queryObj);
  // // console.log(queryStr);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  // const finalQuery = JSON.parse(queryStr);
  // console.log(queryObj);
  // try {
  // find({duration:{$gte:90},ratings:{$gte:4.5},price:{$lte:100}})
  // if (moviesCount) {

  //   if (skip >= moviesCount) {
  //     // throw new Error("This page is not found!");
  //     const err = new CustomError('This page is not found!',404);
  //     next(err);
  //   }
  // }
  // const movies = await Movie.find(finalQuery)
  //   .skip(skip)
  //   .limit(limit)
  //   .sort(sort)
  //   .select(fields);
  const movies = await features.query;
  const count = movies.length;
  res.status(200).json({
    status: "success",
    count,
    data: {
      movies,
    },
  });
  // }

  // catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err.message,
  //   });
  // }
});

//######### creating id for new inserting movie---########

const createAmovie = asyncErrorHandler(async (req, res, next) => {
  // try {
  const newMovie = await Movie.create(req.body);
  res.status(201).json({
    status: "success",
    movie: newMovie,
  });
  // } catch (err) {
  //   // console.log(err.message);
  //   res.status(400).json({
  //     status: "fail",
  //     message: err.message,
  //   });
  // }
});

// ######### FIND A MOVIE ##########

const findAmovie = asyncErrorHandler(async (req, res, next) => {
  // console.log(req.params);
 

  // res.send('found');

  // try {
  // const movie = await Movie.find({ _id: req.params.id });  same thing as below

  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    const error = new CustomError("Movie with this ID is not found!", 404);
    return next(error);
  }

  res.status(200).json({
    status: "success",
    data: {
      movie,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err.message,
  //   });
  // }
});

// ########## UPDATE A MOVIE ###########

const updateMovie = asyncErrorHandler(async (req, res, next) => {
  // try {
  const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedMovie) {
    const error = new CustomError("Movie with this ID is not found!", 404);
    return next(error);
  }
  res.status(200).json({
    status: "success",
    data: {
      updatedMovie,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err.message,
  //   });
  // }
});

// ############ DELETE A MOVIE  ############

const deleteMovie = asyncErrorHandler(async (req, res, next) => {
  // try {
  const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
  if (!deletedMovie) {
    const error = new CustomError("Movie with this ID is not found!", 404);
    return next(error);
  }
  res.status(200).json({
    status: "success",
    data: null,
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: "fail",
  //     message: err.message,
  //   });
  // }
});

module.exports = {
  getAllMovies,
  createAmovie,
  findAmovie,
  updateMovie,
  deleteMovie,
};
