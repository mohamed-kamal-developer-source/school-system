const express = require("express");
const router = express.Router();
const userController = require("../controllers/userContoller");

router.route("/sign").post(userController.signIn);

router.route("/forgetPassword").post(userController.forgetPassword);

router.route("/resetPassword/:token").post(userController.resetPassword);

router
  .route("/updatePassword")
  .post(userController.protect, userController.updatePassword);

router
  .route("/updateMe")
  .post(userController.protect, userController.updateMe);

router.route("/").post(userController.createUser);

router.route("/:id").get(userController.getOneUser);

module.exports = router;
