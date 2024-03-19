const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = mongoose.Schema({
  name: {
    required: [true, "please enter your name."],
    type: String,
  },
  email: {
    type: String,
    required: [true, "Please enter an email."],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email."],
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please enter a password."],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password."],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Password and Confirm Password doesn't match",
    },
  },
  active: {
    type: Boolean,
    default: true,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
});

userSchema.pre(/^find/, function (next) {
  // this keyword in the function will point to the current query.
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.comparePasswordInDb = async function (paswd, paswdInDb) {
  return await bcrypt.compare(paswd, paswdInDb);
};

userSchema.methods.isPasswordChanged = async function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const paswdChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(paswdChangedTimestamp,jwtTimestamp);
    return paswdChangedTimestamp > jwtTimestamp;
  }
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; // Give 10 minute time(in millisecs) to reset password
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
