const express = require("express");
const router = express.Router();

const userControlller = require("../controllers/userContoller");
const subjectControlller = require("../controllers/subjectController");

router
  .route("/getClasses/:id")
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    subjectControlller.getSubjectClasses,
  );
router
  .route("/getTeachers/:id")
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    subjectControlller.getSubjectTeachers,
  );

router
  .route("/")
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    subjectControlller.getAllSubjects,
  )
  .post(subjectControlller.createSubject);

router
  .route("/:id")
  .get(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    subjectControlller.getOneSubject,
  )
  .patch(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    subjectControlller.updateSubject,
  )
  .delete(
    userControlller.protect,
    userControlller.ristrictTo("admin"),
    subjectControlller.deleteSubject,
  );

module.exports = router;
