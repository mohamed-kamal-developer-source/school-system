const express = require("express");
const router = express.Router();

const studentControlller = require("../controllers/studentContoller");
const userControlller = require("../controllers/userContoller");
const uploadExcel = require("../Utils/uploadExcel");
const adminController = require("../controllers/adminController");

router
  .route("/dashboard")
  .get(
    userControlller.protect,
    userControlller.ristrictTo("student"),
    studentControlller.getStudentDashboard,
  );

router
  .route("/getClass/:id") //get class of student
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin", "student"),
    studentControlller.getStudentClass,
  );

router
  .route("/getSubjects/:id") //get subjects of student
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin", "student"),
    studentControlller.getStudentSubjects,
  );

router
  .route("/getClass") //get class of student
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin", "student"),
    studentControlller.getStudentClass,
  );

router
  .route("/getSubjects") //get subjects of student
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin", "student"),
    studentControlller.getStudentSubjects,
  );

router
  .route("/getGrades/:id")
  .post(
    userControlller.protect,
    userControlller.ristrictTo("student", "admin"),
    studentControlller.getStudentGrades,
  );

router
  .route("/enrollStudent")
  .post(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    studentControlller.enrollStudent,
  );

router
  .route("/import")
  .post(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    uploadExcel.single("file"),
    adminController.bulkCreateStudents,
  );

router
  .route("/getAttendance")
  .get(
    userControlller.protect,
    userControlller.ristrictTo("student", "admin"),
    studentControlller.getStudentAttendace,
  );
router
  .route("/getAttendance")
  .post(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    studentControlller.getStudentAttendace,
  );

router
  .route("/transferStudent")
  .patch(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    studentControlller.transferStudent,
  );

router
  .route("/")
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    studentControlller.getAllStudents,
  )
  .post(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    studentControlller.createStudent,
  );

router
  .route("/:id")
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    studentControlller.getOneStudent,
  )
  .patch(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    studentControlller.updateStudent,
  )
  .delete(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    studentControlller.deleteStudent,
  );

module.exports = router;
