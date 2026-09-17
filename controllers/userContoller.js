const client = require("../pg");
const asyncErrorHandeler = require("../Utils/asyncErrorHandeler");
const customError = require("../Utils/customError");

const jwt = require("jsonwebtoken");
const util = require("util");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const sendEmail = require("../Utils/email");

const signToken = (id) => {
  const token = jwt.sign({ id: id }, process.env.SECRET_KEY, {
    expiresIn: process.env.TOKEN_EXPIRE,
  });
  return token;
};

const passwordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return token;
};

userResponse = (res, statusCode, data) => {
  res.status(statusCode).json({ status: "success", data });
};

exports.getAllusers = asyncErrorHandeler(async (req, res, next) => {
  const query = "SELECT * FROM users WHERE active = true";
  const users = await client.query(query);

  if (!users.rowCount) {
    return next(new customError("users not found", 404));
  }

  userResponse(res, 200, { users: users.rows });
});

exports.createUser = asyncErrorHandeler(async (req, res, next) => {
  const { name, email, confirmPassword, role } = req.body;

  let password = req.body.password;
  if (password !== confirmPassword) {
    return next(
      new customError("password && confirm password is not match", 404),
    );
  }
  password = await bcrypt.hash(password, 12);

  const query = `
    INSERT INTO users (name, email, password_hash,role)
    VALUES($1,$2,$3,$4)
    RETURNING id, name, email`;

  const values = [name, email, password, role];

  const user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("no user created", 404));
  }

  user.rows[0].token = signToken(user.rows[0].id);

  userResponse(res, 201, { user: user.rows[0] });
});

exports.getOneUser = asyncErrorHandeler(async (req, res, next) => {
  const query = `
  SELECT id,name,email,role FROM users WHERE id = $1 AND active = true`;

  const values = [req.params.id];
  const user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("no user found", 404));
  }

  userResponse(res, 200, { user: user.rows[0] });
});


exports.ristrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new customError(
          "You do not have permission to perform this action",
          403,
        ),
      );
    }

    next();
  };
};

exports.updateMe = asyncErrorHandeler(async (req, res, next) => {
  const fields = Object.keys(req.body);

  const allowed = ["name", "email"];

  const setString = fields
    .filter((e) => allowed.includes(e) === true)
    .map((e, i) => `${e} = $${i + 1}`)
    .join(", ");

  const values = fields.map((key) => req.body[key]);
  values.push(req.params.id);

  const query = `
  UPDATE users SET ${setString} WHERE id = $${values.length} AND active = true
  RETURNING *`;
  const user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("no user found", 404));
  }

  userResponse(res, 200, { user: user.rows[0] });
});

exports.deleteuser = asyncErrorHandeler(async (req, res, next) => {
  const query = `
    UPDATE users SET active = false WHERE id = $1 AND active = true`;

  const values = [req.params.id];

  const user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("no user found", 404));
  }

  userResponse(res, 200, { message: "user has deleted" });
});

exports.protect = asyncErrorHandeler(async (req, res, next) => {
  const testToken = req.headers.authorization;
  let token;

  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1];
  }

  if (!token) {
    return next(new customError("there is no token. please try again", 401));
  }

  const decodedToken = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_KEY,
  );
  const id = decodedToken.id;

  const query =
    "SELECT id, name, email,role FROM users WHERE id = $1 AND active = true";
  const values = [id];
  const user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("no user found", 404));
  }

  req.user = user.rows[0];

  next();
});

exports.signIn = asyncErrorHandeler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new customError("email && password is required", 404));
  }
  const query =
    "SELECT * FROM users WHERE email = $1 AND active = true";
  const values = [email];
  const user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("no user found with this email", 404));
  }

  const hashPassword = user.rows[0].password_hash;
  const isMatch = await bcrypt.compare(password, hashPassword);

  if (!isMatch) {
    return next(new customError("invalid password. please try again", 404));
  }

  user.rows[0].token = signToken(user.rows[0].id);
  delete user.rows[0].password_hash;
  userResponse(res, 200, { user: user.rows[0] });
});

exports.forgetPassword = asyncErrorHandeler(async (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    return next(new customError("email is required", 404));
  }

  let query = "SELECT * FROM users WHERE email = $1 AND active = true";
  let values = [email];
  let user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("invalid email", 404));
  }

  const resetToken = passwordResetToken();

  const hashToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  query = `
  UPDATE users
   SET password_reset_token = $1,
   password_reset_token_timestamp = to_timestamp($2)
   WHERE email = $3
   RETURNING email`;

  values = [hashToken, Math.trunc(Date.now() + 10 * 60 * 1000), email];
  user = await client.query(query, values);

  const resetUrl = `${req.protocol}://${req.get(
    "host",
  )}/api/v1/bank/resetPassword/${resetToken}`;

  const message = `we have received your reset request please open this url to reset your password: ${resetUrl}`;

  try {
    await sendEmail({
      email: user.rows[0].email,
      subject: "password reset request recieved",
      message: message,
    });
  } catch (err) {
    query =
      "UPDATE user SET password_reset_token = null,password_reset_token_timestamp = null WHERE email = $1";
    values = [email];
    user = await client.query(query, values);
    return next(
      new customError(
        `there are an error sending password reset. please try again later:${err}`,
        500,
      ),
    );
  }

  userResponse(res, 200, { message: "we send reset token for your email" });
});

exports.resetPassword = asyncErrorHandeler(async (req, res, next) => {
  const token = req.params.token;
  const hashToken = crypto.createHash("sha256").update(token).digest("hex");

  let query =
    "SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_token_timestamp > to_timestamp($2)";
  let values = [hashToken, Date.now()];
  let user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("invalid token", 404));
  }
  const id = user.rows[0].id;

  let newPassword = req.body.newPassword;
  const confirmPassowrd = req.body.confirmPassword;
  if (!newPassword || !confirmPassowrd) {
    return next(
      new customError("newPassword && confirmPassowrd are required ", 404),
    );
  }

  if (newPassword !== confirmPassowrd) {
    return next(
      new customError("newPassword && confirmPassowrd is not match ", 404),
    );
  }

  query = ` 
  UPDATE users
   SET password = $1,
   password_reset_token = null ,
    password_reset_token_timestamp = null
    WHERE id = $2
    RETURNING id, name, email, phone`;

  newPassword = await bcrypt.hash(newPassword, 12);
  values = [newPassword, id];
  user = await client.query(query, values);

  userResponse(res, 200, { user: user.rows[0] });
});

exports.updatePassword = asyncErrorHandeler(async (req, res, next) => {
  const userId = req.user.id;
  const { oldPassword, newPassword, confirmPassowrd } = req.body;

  if (!oldPassword || !newPassword || !confirmPassowrd) {
    return next(
      new customError(
        "oldPassword && newPassword && confirmPassowrd is required",
        404,
      ),
    );
  }

  let query = `SELECT * FROM users WHERE id = $1 AND active = true`;
  let values = [userId];
  const user = await client.query(query, values);

  const password = user.rows[0].password;

  const checkPassword = await bcrypt.compare(oldPassword, password);

  if (!checkPassword) {
    return next(new customError("invalid password", 404));
  }

  if (newPassword !== confirmPassowrd) {
    return next(
      new customError("newPassword && confirmPassowrd is not match", 404),
    );
  }

  const hashPassword = await bcrypt.hash(newPassword, 12);

  query = `UPDATE users SET password = $1,updated_at = NOW() WHERE id = $2`;
  values = [hashPassword, userId];
  await client.query(query, values);

  userResponse(res, 200, { message: "password has updated successfully" });
});
