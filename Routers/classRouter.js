const express = require("express");
const router = express.Router();

const userController = require("../controllers/userContoller");
const classControlller = require("../controllers/classController");

router
  .route("/getAttendance")
  .post(
    userController.protect,
    userController.ristrictTo("admin", "teacher"),
    classControlller.getAttendanceOfClass,
  );

router
  .route("/getGrades")
  .post(
    userController.protect,
    userController.ristrictTo("admin", "teacher"),
    classControlller.getGradesOfClass,
  );

router
  .route("/getSubjects/:id")
  .get(
    userController.protect,
    userController.ristrictTo("admin"),
    classControlller.getClassSubjects,
  );

router
  .route("/getStudents/:id")
  .get(
    userController.protect,
    userController.ristrictTo("admin", "teacher"),
    classControlller.getClassStudents,
  );

router
  .route("/getTeachers/:id")
  .get(
    userController.protect,
    userController.ristrictTo("admin"),
    classControlller.getClassTeachers,
  );

router
  .route("/")
  .get(
    userController.protect,
    userController.ristrictTo("admin"),
    classControlller.getAllClasses,
  )
  .post(classControlller.createClass);

router
  .route("/:id")
  .get(
    userController.protect,
    userController.ristrictTo("admin"),
    classControlller.getOneClass,
  )
  .patch(
    userController.protect,
    userController.ristrictTo("admin"),
    classControlller.updateClass,
  )
  .delete(
    userController.protect,
    userController.ristrictTo("admin"),
    classControlller.deleteClass,
  );

module.exports = router;
