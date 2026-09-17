const customError = require("./customError");
module.exports = (...fields) => {
  for (let i = 0; i < fields.length; i++) {
    if (fields[i] === undefined || fields[i] === null || fields[i] === "") {
      throw new customError("invalid or empty data ", 400);
    }
  }
};

