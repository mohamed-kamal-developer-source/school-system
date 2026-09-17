const obj = {
  name: "Sara Ali ",
  email: "sara2.ali@example.com",
  age: 15,
  gender: "female",
  phone: "01122334455",
  parent_name: "",
  parent_phone: "01199887766",
};

let obj1 = {

}

for (let i = 0; i < Object.keys(obj).length; i++) {
  if (Object.keys(obj)[i] === "name"||Object.keys(obj)[i] === "email") {
    obj1[Object.keys(obj)[i]] = Object.values(obj)[i]
  }
}

console.log(obj1);
