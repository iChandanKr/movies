const User = require("../model/userModel");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const jwt = require("jsonwebtoken");
const CustomError = require("../utils/customError");
const util = require("util");
const sendEmail = require("../utils/email");
const crypto = require("crypto");

const fileterReqObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((prop) => {
    if (allowedFields.includes(prop)) {
      newObj[prop] = obj[prop];
    }
  });
  return newObj;
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_KEY, {
    expiresIn: process.env.LOGIN_EXPIRES * 24 * 60 * 60, //to convert 30 days into secs
  });
};

const createSendResponse = (user, statusCode, res) => {

  const token = signToken(user._id);
 
  const options = {
    expires:new Date(Date.now()+process.env.COOKIE_EXPIRES*24*60*60*1000),
   httpOnly:true
  }
  if(process.env.NODE_ENV ==='prodection'){
    options.secure = true;
  }
  const sendUser = JSON.parse(JSON.stringify(user));
  delete sendUser.password;
  res.status(statusCode).cookie('token',token,options).json({
    status: "success",
    token,
    data: {
      user: sendUser,
    },
  });
};


// --------------GET ALL USERS ------------------
exports.getAllUsers = asyncErrorHandler(async(req,res,next)=>{
  const users = await User.find();
  res.status(200).json({
    status:"success",
    count:users.length,
    data:{
      users
    }
  })
})

// ------------ CREATE USER -----------------

exports.createUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  // const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
  //   expiresIn: process.env.LOGIN_EXPIRES * 24 * 60 * 60, //to convert 30 days into secs
  // });
  createSendResponse(user, 201, res);
});

// ---------------- USER LOGIN ----------------------

exports.loginUser = asyncErrorHandler(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  // const{email,password} = req.body;

  // checking for email and password provided or not
  if (!email || !password) {
    const error = new CustomError(
      "Please enter email and password to login...",
      400
    );
    next(error); // it will call the global errorhandler middleware
  }

  // checking the user with provided email exists or not
  const user = await User.findOne({ email }).select("+password");
  // since user is instance of User model therefore we can call methods of model.
  let isMatch = false;
  if (user) {
    isMatch = await user.comparePasswordInDb(password, user.password);
  }

  if (!user || !isMatch) {
    const error = new CustomError(
      "Incorrect email or password please check.",
      401
    );
    return next(error);
  }
  createSendResponse(user, 200, res);
});

// -------- PROTECTING MIDDLEWARE ----------------

exports.protect = asyncErrorHandler(async (req, res, next) => {
  //1. read the token if exists
  const testToken = req.headers.authorization;
  let token;
  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1]; //.split returns array and we will take second element as token
  }
  if (!token) {
    const error = new CustomError("you are not logged in!", 401);
    return next(error);
  }

  //2. validate token
  const verifyToken = util.promisify(jwt.verify); // it will return a asynchronous function
  const decodedToken = await verifyToken(token, process.env.SECRET_KEY);
  // console.log(decodedToken);

  //3. if the user exists
  const user = await User.findById(decodedToken.id);
  if (!user) {
    const error = new CustomError(
      "The user with the given token doesn't exist",
      401
    );
    return next(error);
  }

  //4. if the user changed the password after the token was issued
  const isPswdChanged = await user.isPasswordChanged(decodedToken.iat);
  if (isPswdChanged) {
    const error = new CustomError(
      "The password has been changed recently. Please login again",
      401
    );
    return next(error);
  }
  //5. allow user to access route
  // console.log(user.id);
  req.user = user;

  next();
});

// ---------------- ROLE BASED ACCESS FUNCTION ---------------------

exports.restrict = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      const error = new CustomError(
        "You don't have permission to perform this action",
        403
      );
      next(error);
    }
    next();
  };
};

// -------------- FORGET PASSWORD -----------------------------------

exports.forgetPassword = asyncErrorHandler(async (req, res, next) => {
  // 1. find user with given email

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const error = new CustomError("User with this email doesn't exist", 404);
    next(error);
  }

  //2. generate a random reset token to update the password.
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  console.log(resetToken, user.passwordResetToken);

  //3. send mail to the user
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/reset-password/${resetToken}`;
  const message = `We have received a password reset request. Please use below link to reset your password.\n\n${resetUrl}\n\nThis reset password link will be valid for only 10 minutes.`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Password change request received",
      message: message,
    });
    res.status(200).json({
      status: "success",
      message: "password rest link has been sent to user email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new CustomError(
        "There is an error in sending password reset mail. Please try again later",
        500
      )
    );
  }
});

// -------------------- RESET PASSWORD -----------------------------

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  // 1. first we have to again encrypt the token to match with token stored in database i.e. alrady encrypted and
  // sha256 always create same hash value for same input.
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    const error = new CustomError(
      "Reset password token is invalid or has been expired",
      400
    );
    return next(error);
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  createSendResponse(user, 200, res);
});

// -----------------UPDATE PASSWORD ---------------
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  // 1.Get current user data from database
  const user = await User.findById(req.user._id).select("+password"); //this middleware execute after protect middleware and in protect we assign req.user = user from there we can access req.user._id;

  // 2.Check the provided current password is correct or not
  if (
    !(await user.comparePasswordInDb(req.body.currentPassword, user.password))
  ) {
    const error = new CustomError(
      "The current password you provided is Wrong!",
      401
    );
    return next(error);
  }
  // 3. if provided current password is correct the update the password with new password
  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmPassword;

  await user.save();
  createSendResponse(user, 200, res);
});

// ----------------- UPDATE USER DETAILS --------------

exports.updateMe = asyncErrorHandler(async (req, res, next) => {
  // 1. check if request data having password or confirmPassword
  if (req.body.password || req.body.confirmPassword) {
    const error = new CustomError(
      "You can not update password using this end point",
      400
    );
    return next(error);
  }
  //this middleware execute after protect middleware and in protect we assign req.user = user from there we can access req.user._id;

  // 2.update user details
  const filterObj = fileterReqObj(req.body, "name", "email");
  const updateUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
    runValidators: true,
    new: true,
  });
  createSendResponse(updateUser,200,res);
});


// -----------------DELETE USER ----------------
exports.deleteMe = asyncErrorHandler(async(req,res,next)=>{
  const deleteUser = await User.findByIdAndUpdate(req.user.id,{active:false});
  res.status(204).json({
    status:'success',
    data:null

  })
})