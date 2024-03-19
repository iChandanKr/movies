const express = require("express");
const app = express();
const movieRouter = require("./router/movieRoute");
const usersRouter = require('./router/usersRoute');
const CustomError = require("./utils/customError");
const globalErrorHandler = require('./utils/globalErrorHandler');
const rateLimit = require('express-rate-limit');
const sanitize = require('express-mongo-sanitize');
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("./data/movies.json", "utf-8"));
// console.log(JSON.parse(data));


const limiter = rateLimit({
  max:1000,
  windowMs:60*60*1000,
  message:'We have received too many request from this IP. Please try after an hour'
})

app.use('/api',limiter);  // we want to set limit on all the apis whose link starts with /api





app.use(express.json());
app.use(sanitize());


app.use("/api/v1", movieRouter);
app.use('/api/v1',usersRouter)

app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status: "fail",
  //   message: `Can't found ${req.originalUrl} on the server! `,
  // });
  const err = new CustomError(`Can't found ${req.originalUrl} on the server! `,404);
  next(err);      // it will automatic call the global error handler middleware
});

app.use(globalErrorHandler);

module.exports = app;
