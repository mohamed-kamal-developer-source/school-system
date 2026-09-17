const app = require("./app");
const client = require("./pg");

app.listen(3232, () => {
  console.log("server has started...");
});

client.connect().then(() => {
  console.log("DB connection successful");
});


