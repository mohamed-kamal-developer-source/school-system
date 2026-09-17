const express = require("express");
const paymentController = require("../controllers/paymentController");
const userController = require("../controllers/userContoller");

const router = express.Router();

router.get(
  "/",
  userController.protect,
  userController.ristrictTo("admin", "student"),
  paymentController.getPayments,
);

router.post(
  "/",
  userController.protect,
  userController.ristrictTo("admin"),
  paymentController.createPayment,
);

router.patch(
  "/:id/pay",
  userController.protect,
  userController.ristrictTo("admin"),
  paymentController.markPaymentPaid,
);

module.exports = router;
