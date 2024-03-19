const CustomError = require("./customError");

const devErrors = (res, error) => {
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

const prodErrors = (res, error) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "something went wrong! please try again later",
    });
  }
};

const castErrorHandler = (err) => {
  const msg = `invalid value for ${err.path} : ${err.value}`;
  return new CustomError(msg, 400);
};
const duplicateErrorHandler = (err) => {
  const name = err.keyValue.name;
  const msg = `There is already a movie with name ${name}. Please use another name!`;
  return new CustomError(msg, 400);
};

const validationErrorHandler = (err)=>{
  const a =  Object.values(err.errors).map((val)=>{
    return val.message;
  }).join('. ');
const msg = `Invalid input data: ${a}`;
  return new CustomError(msg,400);
}

const handleExpiredJWT = (err)=>{
  return new CustomError("JWT has expired. Please login again!",401);
}
const handleJWTError = (err)=>{
  return new CustomError('Invalid token. Please login again!',401);
}


module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    let err = JSON.parse(JSON.stringify(error)); //creating deep copy of error
    // console.log(err);
    if (err.name === "CastError") {
      err = castErrorHandler(err);
      return prodErrors(res, err);
    }
    if (err.code === 11000) {
      err = duplicateErrorHandler(err);
      return prodErrors(res, err);
    }
    if (err.name === "ValidationError") {
      err = validationErrorHandler(err);
      return prodErrors(res, err);
    }
    if(err.name ==="TokenExpiredError"){
      err = handleExpiredJWT(err);
      return prodErrors(res,err);
    }
    if(err.name="JsonWebTokenError"){
      err = handleJWTError(err);
      return prodErrors(res,err);
    }

    prodErrors(res, error);
  }
};
