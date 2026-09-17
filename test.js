const bcrypt = require("bcryptjs");

async function test() {
  const password = await bcrypt.hash("test1234", 12);

  console.log(password);
}

test();
