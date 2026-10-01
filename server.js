const app = require("./app");
const pool = require("./pg");

app.listen(3232, () => {
  console.log("server has started...");
});

pool
  .connect()
  .then((client) => {
    console.log("DB connection successful");
    client.release();
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
  });