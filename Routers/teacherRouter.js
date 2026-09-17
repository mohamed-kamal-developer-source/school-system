const express = require("express");
const router = express.Router();

const teacherController = require("../controllers/teacherController");
const userController = require("../controllers/userContoller");
const uploadExcel = require("../Utils/uploadExcel");

router
  .route("/grades/import")
  .post(
    userController.protect,
    userController.ristrictTo("teacher"),
    uploadExcel.single("file"),
    teacherController.bulkAddGrades,
  );

router
  .route("/attendance/import")
  .post(
    userController.protect,
    userController.ristrictTo("teacher"),
    uploadExcel.single("file"),
    teacherController.bulkAddAttendance,
  );

router
  .route("/addGrades")
  .post(
    userController.protect,
    userController.ristrictTo("teacher","admin"),
    teacherController.addGradeforStudent,
  );

router
  .route("/updateGrade/:id")//اضافه او ابديت او حذف لطالب واحد 
  .patch(
    userController.protect,
    userController.ristrictTo("teacher","admin"),
    teacherController.updateGradeForStudent,
  );

router
  .route("/deleteGrade/:id")//اضافه او ابديت او حذف لطالب واحد 
  .delete(
    userController.protect,
    userController.ristrictTo("teacher","admin"),
    teacherController.deleteGrade,
  );

router
  .route("/addAttendance")//اضافه او ابديت او حذف لطالب واحد 
  .post(
    userController.protect,
    userController.ristrictTo("teacher","admin"),
    teacherController.addAttendanceForStudent,
  );

router
  .route("/updateAttendance/:id")//اضافه او ابديت او حذف لطالب واحد 
  .patch(
    userController.protect,
    userController.ristrictTo("teacher","admin"),
    teacherController.updateAttendanceForStudent,
  );

router
  .route("/deleteAttendance/:id")//اضافه او ابديت او حذف لطالب واحد 
  .delete(
    userController.protect,
    userController.ristrictTo("teacher","admin"),
    teacherController.deleteAttendance,
  );

router
  .route("/teacherClasses")
  .get(
    userController.protect,
    userController.ristrictTo("teacher","admin"),
    teacherController.getTeacherClassses,
  );

router
  .route("/teacherClasses")
  .post(
    userController.protect,
    userController.ristrictTo("teacher","admin"),
    teacherController.getTeacherClassses,
  );

router
  .route("/gradesClass")
  .post(
    userController.protect,
    userController.ristrictTo("teacher", "admin"),
    teacherController.getGradesOfClass,
  );

router
  .route("/")
  .get(
    userController.protect,
    userController.ristrictTo("admin"),
    teacherController.getAllTeachers,
  )
  .post(
    userController.protect,
    userController.ristrictTo("admin"),
    teacherController.createTeacher,
  );

router
  .route("/:id")
  .get(
    userController.protect,
    userController.ristrictTo("admin"),
    teacherController.getOneTeacher,
  )
  .patch(
    userController.protect,
    userController.ristrictTo("admin"),
    teacherController.updateTeacher,
  )
  .delete(
    userController.protect,
    userController.ristrictTo("admin"),
    teacherController.deleteTeacher,
  );

module.exports = router;
