const express = require("express");
const uploadExcel = require("../Utils/uploadExcel");
const adminController = require("../controllers/adminController");
const userController = require("../controllers/userContoller");

const router = express.Router();

router.use(userController.protect, userController.ristrictTo("admin"));

router.get("/dashboard", adminController.getDashboard);
router.post("/students/import", uploadExcel.single("file"), adminController.bulkCreateStudents);

module.exports = router;
