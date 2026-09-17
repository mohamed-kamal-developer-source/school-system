const bcrypt = require("bcryptjs");
const client = require("../pg");
const asyncErrorHandeler = require("../Utils/asyncErrorHandeler");
const customError = require("../Utils/customError");
const { readExcelRows, required } = require("../Utils/bulkExcel");

const respond = (res, statusCode, data) =>
  res.status(statusCode).json({ status: "success", data });

const allowedGenders = new Set(["male", "female", "other"]);

exports.bulkCreateStudents = asyncErrorHandeler(async (req, res, next) => {
  const rows = readExcelRows(req.file);
  const emails = new Set();
  const students = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    required(
      row,
      [
        "name",
        "email",
        "password",
        "age",
        "gender",
        "phone",
        "parent_name",
        "parent_phone",
      ],
      rowNumber,
    );

    const email = String(row.email).trim().toLowerCase();
    const age = Number(row.age);
    const gender = String(row.gender).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return next(new customError(`Row ${rowNumber}: invalid email`, 400));
    }
    if (!Number.isInteger(age) || age < 3 || age > 100) {
      return next(
        new customError(`Row ${rowNumber}: age must be between 3 and 100`, 400),
      );
    }
    if (!allowedGenders.has(gender)) {
      return next(
        new customError(
          `Row ${rowNumber}: gender must be male, female, or other`,
          400,
        ),
      );
    }
    if (emails.has(email)) {
      return next(
        new customError(`Row ${rowNumber}: duplicate email in Excel file`, 400),
      );
    }
    emails.add(email);
    students.push({ ...row, email, age, gender });
  }

  const existing = await client.query(
    "SELECT email FROM users WHERE LOWER(email) = ANY($1::text[])",
    [[...emails]],
  );
  if (existing.rowCount) {
    return next(
      new customError(
        `Email already exists: ${existing.rows.map((item) => item.email).join(", ")}`,
        409,
      ),
    );
  }

  const created = [];
  await client.query("BEGIN");
  try {
    for (const student of students) {
      const passwordHash = await bcrypt.hash(String(student.password), 12);
      const user = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'student')
         RETURNING id, name, email`,
        [String(student.name).trim(), student.email, passwordHash],
      );
      const record = await client.query(
        `INSERT INTO student
          (name, email, age, gender, phone, parent_name, parent_phone, user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          String(student.name).trim(),
          student.email,
          student.age,
          student.gender,
          String(student.phone).trim(),
          String(student.parent_name).trim(),
          String(student.parent_phone).trim(),
          user.rows[0].id,
        ],
      );
      created.push(record.rows[0]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  respond(res, 201, { imported: created.length, students: created });
});

exports.getDashboard = asyncErrorHandeler(async (_req, res) => {
  const [students, teachers, paymentSummary] = await Promise.all([
    client.query(`
      SELECT s.id, s.name, s.email,
             ROUND(AVG((g.score / NULLIF(g.max_score, 0)) * 100), 2) AS average_score,
             COUNT(g.id)::INTEGER AS grades_count
      FROM student s
      JOIN grades g ON g.student_id = s.id AND g.active = TRUE
      WHERE s.active = TRUE
      GROUP BY s.id, s.name, s.email
      ORDER BY average_score DESC, grades_count DESC, s.name ASC
      LIMIT 5`),
    client.query(`
      SELECT t.id, t.name, t.email,
             ROUND(AVG((g.score / NULLIF(g.max_score, 0)) * 100), 2) AS students_average_score,
             COUNT(g.id)::INTEGER AS grades_recorded
      FROM teacher t
      JOIN grades g ON g.recorded_by = t.id AND g.active = TRUE
      WHERE t.active = TRUE
      GROUP BY t.id, t.name, t.email
      ORDER BY students_average_score DESC, grades_recorded DESC, t.name ASC
      LIMIT 5`),
    client.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND active = TRUE), 0) AS paid_amount,
        COALESCE(SUM(amount) FILTER (WHERE status IN ('pending', 'overdue') AND active = TRUE), 0) AS outstanding_amount,
        COUNT(*) FILTER (WHERE status IN ('pending', 'overdue') AND active = TRUE)::INTEGER AS outstanding_payments
      FROM payments`),
  ]);

  respond(res, 200, {
    top_students: students.rows,
    top_teachers: teachers.rows,
    payments: paymentSummary.rows[0],
  });
});
