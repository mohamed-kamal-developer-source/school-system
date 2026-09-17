const express = require("express");
const router = express.Router();

const userController = require("../controllers/userContoller");
const classSubjectsControlller = require("../controllers/classSubjectsController");

router
  .route("/deleteTeacher")
  .delete(
    userController.protect,
    userController.ristrictTo("admin"),
    classSubjectsControlller.deleteTeacherFromClass,
  );

router
  .route("/")
  .post(
    userController.protect,
    userController.ristrictTo("admin"),
    classSubjectsControlller.createClassSubjects,
  );

router
  .route("/:id")
  .get(
    userController.protect,
    userController.ristrictTo("admin"),
    classSubjectsControlller.getClassSubjects,
  )
  .patch(
    userController.protect,
    userController.ristrictTo("admin"),
    classSubjectsControlller.updateClassSubjects,
  );

module.exports = router;
