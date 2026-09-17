const crypto = require("crypto");
const client = require("../pg");
const asyncErrorHandeler = require("../Utils/asyncErrorHandeler");
const customError = require("../Utils/customError");
const validationData = require("../Utils/validation");

const respond = (res, statusCode, data) =>
  res.status(statusCode).json({ status: "success", data });

const methods = new Set(["cash", "card", "bank_transfer", "wallet"]);
const makeReference = () => `SCH-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

exports.createPayment = asyncErrorHandeler(async (req, res, next) => {
  const { studentId, amount, dueDate, description, paymentMethod = "cash", currency = "EGP" } = req.body;
  validationData(studentId, amount, dueDate, description);
  if (!methods.has(paymentMethod)) return next(new customError("Invalid payment method", 400));
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return next(new customError("Amount must be greater than zero", 400));
  }

  const payment = await client.query(
    `INSERT INTO payments
      (student_id, amount, currency, payment_method, description, due_date, reference, recorded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [studentId, amount, String(currency).toUpperCase(), paymentMethod, description, dueDate, makeReference(), req.user.id],
  );
  respond(res, 201, { payment: payment.rows[0] });
});

exports.markPaymentPaid = asyncErrorHandeler(async (req, res, next) => {
  const paymentId = req.params.id;
  validationData(paymentId);
  const payment = await client.query(
    `UPDATE payments
     SET status = 'paid', paid_at = NOW(), payment_method = COALESCE($1, payment_method), recorded_by = $2
     WHERE id = $3 AND active = TRUE AND status IN ('pending', 'overdue')
     RETURNING *`,
    [req.body.paymentMethod || null, req.user.id, paymentId],
  );
  if (!payment.rowCount) return next(new customError("Pending payment not found", 404));
  respond(res, 200, { payment: payment.rows[0] });
});

exports.getPayments = asyncErrorHandeler(async (req, res, next) => {
  const values = [];
  let where = "WHERE p.active = TRUE";
  if (req.user.role === "student") {
    values.push(req.user.id);
    where += ` AND s.user_id = $${values.length}`;
  } else if (req.query.studentId) {
    values.push(req.query.studentId);
    where += ` AND p.student_id = $${values.length}`;
  }
  const payments = await client.query(
    `SELECT p.*, s.name AS student_name, s.email AS student_email
     FROM payments p
     JOIN student s ON s.id = p.student_id
     ${where}
     ORDER BY p.due_date DESC, p.id DESC`,
    values,
  );
  respond(res, 200, { payments: payments.rows });
});