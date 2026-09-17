const CustomError = require("../Utils/customError");

const prodError = (res, error) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
  });
};

const devError = (res, error) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stack: error.stack,
    error,
  });
};

const duplicateKeyErrorHandler = (err) => {
  const msg = "Duplicate field value entered.";
  return new CustomError(msg, 400);
};

const castErrorHandler = (err) => {
  const msg = `Invalid value for ${err.path}: ${err.value}`;
  return new CustomError(msg, 400);
};

const validationErrorHandler = (err) => {
  let message = "Invalid input data.";

  if (err.errors) {
    const errors = Object.values(err.errors).map((e) => e.message);
    message = `Invalid input data: ${errors.join(". ")}`;
  }

  return new CustomError(message, 400);
};

const notNullFields = (err) => {
  return new CustomError(`Missing required field: ${err.column}`, 400);
};

const invalidData = (err) => {
  return new CustomError(`invalid data`, 400);
};

const checkConstraintErrorHandler = (err) => {
  let message = "Invalid value.";

  if (
    err.constraint === "check_score" ||
    err.constraint === "check_max_score"
  ) {
    message = "Score must be between 0 and the allowed range.";
  }

  return new CustomError(message, 400);
};

const jwtErrorHandler = () => {
  return new CustomError("Invalid token. Please login again.", 401);
};

const jwtExpiredHandler = () => {
  return new CustomError("Your token has expired. Please login again.", 401);
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    return devError(res, error);
  }

  if (process.env.NODE_ENV === "production") {
    let err = { ...error };
    err.message = error.message;

    if (err.name === "ValidationError") err = validationErrorHandler(err);
    if (err.name === "CastError") err = castErrorHandler(err);
    if (err.code === "23505") err = duplicateKeyErrorHandler(err);
    if (err.name === "JsonWebTokenError") err = jwtErrorHandler();
    if (err.name === "TokenExpiredError") err = jwtExpiredHandler();
    if (err.code === "23514") err = checkConstraintErrorHandler(err);
    if (err.code === "23502") err = notNullFields(err);
    // if (err.code === "22P02" || err.code === "42703") err = invalidData();
    return prodError(res, err);
  }
};
