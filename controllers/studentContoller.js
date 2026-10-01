const client = require("../pg");
const customError = require("../Utils/customError");
const asyncErrorHandeler = require("../Utils/asyncErrorHandeler");
const { object } = require("webidl-conversions");
const bcrypt = require("bcryptjs");
const validationData = require("../Utils/validation");
const apiFeatures = require("../Utils/apiFeatures");
const { text } = require("express");

const studentResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: "success",
    data,
  });
};

exports.getAllStudents = asyncErrorHandeler(async (req, res, next) => {
  const features = new apiFeatures(
    req.query,
    ["age", "gender"],
    ["age", "gender"],
    ["name", "email", "age", "gender", "phone"],
  );

  const { whereClause, orderClause, paginationClause, values } = features
    .filter()
    .search()
    .sort()
    .paginate()
    .build();

  const query = `
  SELECT * FROM student 
  WHERE active = true
  ${whereClause}
  ${orderClause}
  ${paginationClause}`;

  const students = await client.query(query, values);

  if (!students.rowCount) {
    return next(new customError("no students found", 404));
  }

  studentResponse(res, 200, { students: students.rows });
});

exports.createStudent = asyncErrorHandeler(async (req, res, next) => {
  const {
    name,
    email,
    age,
    gender,
    phone,
    parent_name,
    parent_phone,
    confirmPassword,
    role,
  } = req.body;

  let password = req.body.password;

  validationData(
    name,
    email,
    age,
    gender,
    phone,
    parent_name,
    parent_phone,
    confirmPassword,
    role,
    password,
  );

  if (password !== confirmPassword) {
    return next(
      new customError("password && confirm password is not match", 404),
    );
  }
  password = await bcrypt.hash(password, 12);

  let query = `
    INSERT INTO users (name, email, password_hash,role)
    VALUES($1,$2,$3,$4)
    RETURNING id, name, email`;

  let values = [name, email, password, role];

  const user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("no user created", 404));
  }

  const userId = user.rows[0].id;

  query = `
    INSERT INTO student 
    (name,email,age,gender,phone,parent_name,parent_phone,user_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`;

  values = [name, email, age, gender, phone, parent_name, parent_phone, userId];
  const student = await client.query(query, values);

  if (!student.rowCount) {
    return next(new customError("student not created. please try again", 404));
  }

  studentResponse(res, 201, { student: student.rows[0] });
});

exports.getOneStudent = asyncErrorHandeler(async (req, res, next) => {
  const studentId = req.params.id;
  validationData(studentId);

  const query = `SELECT * FROM student WHERE id = $1 AND active = true`;
  const values = [studentId];

  const student = await client.query(query, values);

  if (!student.rowCount) {
    return next(new customError("student not found", 404));
  }

  studentResponse(res, 200, { student: student.rows[0] });
});

exports.updateStudent = asyncErrorHandeler(async (req, res, next) => {
  const studentId = req.params.id;
  validationData(studentId);

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  const setString = fields.map((e, i) => `${e} = $${i + 1}`);
  values.push(studentId);

  const query = `
  UPDATE student 
  SET ${setString} WHERE id = $${values.length} AND active = true
  RETURNING *`;

  const student = await client.query(query, values);

  if (!student.rowCount) {
    return next(new customError("student not found", 404));
  }

  if (req.body.email || req.body.name) {
    const obj = req.body;
    let obj1 = {};

    for (let i = 0; i < Object.keys(obj).length; i++) {
      if (Object.keys(obj)[i] === "name" || Object.keys(obj)[i] === "email") {
        obj1[Object.keys(obj)[i]] = Object.values(obj)[i];
      }
    }

    const fields = Object.keys(obj1);
    const values = Object.values(obj1);
    values.push(student.rows[0].user_id);

    const setString = fields.map((e, i) => `${e} = $${i + 1}`);

    await client.query(
      `UPDATE users 
    SET ${setString}
    WHERE id = $${values.length} AND active = true`,
      values,
    );
  }

  studentResponse(res, 200, { student: student.rows[0] });
});

exports.deleteStudent = asyncErrorHandeler(async (req, res, next) => {
  const studentId = req.params.id;
  validationData(studentId);

  let query = `SELECT user_id FROM student WHERE id = $1 AND active = true`;
  let values = [studentId];
  const student = await client.query(query, values);

  if (!student.rowCount) {
    return next(new customError("student not found", 404));
  }

  query = `UPDATE student SET active = false WHERE id = $1 AND active = true`;
  await client.query(query, values);

  query = `
    UPDATE users SET active = false WHERE id = $1 AND active = true`;

  values = [student.rows[0].user_id];

  const user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("no user found", 404));
  }

  studentResponse(res, 200, { message: "student has deleted" });
});

exports.enrollStudent = asyncErrorHandeler(async (req, res, next) => {
  const { studentId, classId } = req.body;
  validationData(studentId, classId);

  const query = `
  INSERT INTO enrollment (student_id, class_id,end_date,status )
  VALUES ($1,$2,$3,$4)
  RETURNING *`;

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 6);

  const values = [studentId, classId, endDate, "active"];
  const enrollment = await client.query(query, values);

  if (!enrollment.rowCount) {
    return next(new customError("an error please try again!", 404));
  }

  studentResponse(res, 200, { enrollment: enrollment.rows[0] });
});

exports.getStudentGrades = asyncErrorHandeler(async (req, res, next) => {
  let studentId;

  if (req.user.role === "student") {
    const query = `SELECT * FROM student WHERE user_id = $1`;
    const values = [req.user.id];
    const student = await client.query(query, values);
    studentId = student.rows[0].id;
    req.params.id = studentId;
  }

  if (req.user.role === "admin") {
    validationData(req.params.id);
    studentId = req.params.id;
  }

  const query = `
  SELECT 
  g.score AS grade_score,
  g.max_score AS subject_max_score,
  s.name AS subject_name,
  t.name AS teacher_name
  FROM grades g
  JOIN classSubjects cs on g.class_subject_id = cs.id
  JOIN subject s on cs.subject_id = s.id 
  JOIN teacher t on cs.teacher_id = t.id
  WHERE g.student_id = $1
  AND g.active = true
  `;

  const values = [studentId];
  const grades = await client.query(query, values);

  if (!grades.rowCount) {
    return next(new customError("grade not found", 404));
  }

  studentResponse(res, 200, { grades: grades.rows });
});

exports.getStudentAttendace = asyncErrorHandeler(async (req, res, next) => {
  let studentId;

  if (req.user.role === "student") {
    const query = `SELECT * FROM student WHERE user_id = $1`;
    const values = [req.user.id];
    const student = await client.query(query, values);

    studentId = student.rows[0].id;
  }

  if (req.user.role === "admin") {
    validationData(req.body.studentId);
    studentId = req.body.studentId;
  }

  const query = `
  SELECT 
  a.attendance_date AS attendanceDate,
  a.status AS attendanceStatus,
  t.name AS teacherName,
  s.name AS studentName
  FROM attendance a 
  JOIN teacher t on a.recorded_by = t.id
  JOIN student s on a.student_id = s.id
  WHERE a.student_id = $1
  AND a.active = true`;

  const values = [studentId];

  const attendance = await client.query(query, values);

  if (!attendance.rowCount) {
    return next(new customError("attendance not found", 404));
  }

  studentResponse(res, 200, { attendance: attendance.rows });
});

exports.transferStudent = asyncErrorHandeler(async (req, res, next) => {
  const { studentId, classId } = req.body;
  validationData(studentId, classId);

  let query = `SELECT * FROM enrollment WHERE student_id = $1 AND class_id = $2`;
  let values = [studentId, classId];
  const check = await client.query(query, values);

  if (check.rowCount) {
    return next(
      new customError("this student is already exist in this class", 400),
    );
  }

  query = `
  UPDATE enrollment e
  SET active = false
  FROM student s
  WHERE e.student_id = s.id
  AND e.student_id = $1
  AND s.active = true
  AND e.active = true`;

  values = [studentId];

  const result = await client.query(query, values);

  if (!result.rowCount) {
    return next(new customError("invalid data", 404));
  }

  query = `
  INSERT INTO enrollment (student_id, class_id,end_date,status )
  VALUES ($1,$2,$3,$4)
  RETURNING *`;

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 6);

  values = [studentId, classId, endDate, "active"];
  const enrollment = await client.query(query, values);

  if (!enrollment.rowCount) {
    return next(new customError("an error please try again!", 404));
  }

  studentResponse(res, 200, { enrollment: enrollment.rows[0] });
});

exports.getStudentClass = asyncErrorHandeler(async (req, res, next) => {
  let studentId;

  if (req.user.role === "student") {
    const query = `SELECT * FROM student WHERE user_id = $1`;
    const values = [req.user.id];
    const student = await client.query(query, values);

    studentId = student.rows[0].id;
  }

  if (req.user.role === "admin") {
    validationData(req.params.id);
    studentId = req.params.id;
  }

  const query = `
  SELECT 
  c.*
  FROM enrollment e
  JOIN student s ON e.student_id = s.id
  JOIN class c ON e.class_id = c.id
  WHERE s.id = $1
  AND c.active = true`;

  const values = [studentId];

  const Class = await client.query(query, values);

  if (!Class.rowCount) {
    return next(new customError("class not found", 404));
  }

  studentResponse(res, 200, { class: [Class.rows[0]] });
});

exports.getStudentSubjects = asyncErrorHandeler(async (req, res, next) => {
  let studentId;

  if (req.user.role === "student") {
    const query = `SELECT * FROM student WHERE user_id = $1`;
    const values = [req.user.id];
    const student = await client.query(query, values);

    studentId = student.rows[0].id;
  }

  if (req.user.role === "admin") {
    validationData(req.params.id);
    studentId = req.params.id;
  }

  const query = `
  SELECT 
  sb.name AS subject_name
  FROM enrollment e
  JOIN student s ON e.student_id = s.id
  JOIN class c ON e.class_id = c.id
  JOIN classSubjects cs on cs.class_id = c.id
  JOIN subject sb on cs.subject_id = sb.id 
  WHERE s.id = $1
  AND c.active = true
  AND sb.active = true
  AND c.active = true`;

  const values = [studentId];

  const subjects = await client.query(query, values);

  if (!subjects.rowCount) {
    return next(new customError("subjects not found", 404));
  }

  studentResponse(res, 200, { subjects: subjects.rows });
});

exports.getStudentDashboard = asyncErrorHandeler(async (req, res, next) => {
  const student = await client.query(
    `SELECT id FROM student WHERE user_id = $1 AND active = true`,
    [req.user.id],
  );

  if (!student.rowCount) {
    return next(new customError("student not found", 404));
  }

  const query = `
  SELECT
    (
      SELECT COUNT(DISTINCT cs.subject_id)
      FROM enrollment e
      JOIN class c ON c.id = e.class_id AND c.active = true
      JOIN classSubjects cs ON cs.class_id = c.id
      JOIN subject s ON s.id = cs.subject_id AND s.active = true
      WHERE e.student_id = $1 AND e.active = true
    ) AS subjects,

    COALESCE(
      (
        SELECT ROUND(AVG(g.score)::numeric, 2)
        FROM grades g
        WHERE g.student_id = $1 AND g.active = true
      ),
      0
    ) AS grades,

    COALESCE(
      (
        SELECT ROUND(
          100.0 * COUNT(*) FILTER (WHERE LOWER(a.status) = 'present')
          / NULLIF(COUNT(*), 0),
          2
        )
        FROM attendance a
        WHERE a.student_id = $1 AND a.active = true
      ),
      0
    ) AS attendance,

    (
      SELECT json_build_object(
        'level', c.grade_level,
        'name', c.group_name,
        'number',c.room_number
      )
      FROM enrollment e
      JOIN class c ON c.id = e.class_id
      WHERE e.student_id = $1
        AND e.active = true
        AND c.active = true
      LIMIT 1
    ) AS my_class
`;

  const dashboard = await client.query(query, [student.rows[0].id]);
  const values = dashboard.rows[0];

  studentResponse(res, 200, {
    data: {
      subjects: Number(values.subjects),
      grades: Number(values.grades),
      attendance: Number(values.attendance),
      class: `${values.my_class.level} ${values.my_class.name} ${values.my_class.number} `,
    },
  });
});
