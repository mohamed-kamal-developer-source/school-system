const client = require("../pg");
const customError = require("../Utils/customError");
const asyncErrorHandeler = require("../Utils/asyncErrorHandeler");
const { object } = require("webidl-conversions");
const validationData = require("../Utils/validation");
const apiFeatures = require("../Utils/apiFeatures");

const classResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: "success",
    data,
  });
};

exports.getAllClasses = asyncErrorHandeler(async (req, res, next) => {
  const features = new apiFeatures(
    req.query,
    ["grade_level", "academic_year", "room_number"],
    ["grade_level", "academic_year", "room_number", "group_name"],
    ["grade_level", "academic_year", "room_number", "group_name"],
  );

  const { whereClause, orderClause, paginationClause, values } = features
    .filter()
    .search()
    .sort()
    .paginate()
    .build();

  const query = `
  SELECT * FROM class
  WHERE active = true
  ${whereClause}
  ${orderClause}
  ${paginationClause}`;

  const classes = await client.query(query, values);

  if (!classes.rowCount) {
    return next(new customError("no classs found", 404));
  }

  classResponse(res, 200, { classes: classes.rows });
});

exports.createClass = asyncErrorHandeler(async (req, res, next) => {
  const { gradeLevel, groupName, academicYear, roomNumber, status } = req.body;
  validationData(gradeLevel, groupName, academicYear, roomNumber);

  const query = `
    INSERT INTO class 
    (grade_level, group_name, academic_year, room_number,status)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *`;

  const values = [gradeLevel, groupName, academicYear, roomNumber, status];

  const Class = await client.query(query, values);

  if (!Class.rowCount) {
    return next(new customError("class not created. please try again", 404));
  }

  classResponse(res, 201, { class: Class.rows[0] });
});

exports.getOneClass = asyncErrorHandeler(async (req, res, next) => {
  const classId = req.params.id;
  validationData(classId);

  const query = `SELECT * FROM class WHERE id = $1 AND active = true`;
  const values = [classId];

  const Class = await client.query(query, values);

  if (!Class.rowCount) {
    return next(new customError("class not found", 404));
  }

  classResponse(res, 200, { class: Class.rows[0] });
});

exports.updateClass = asyncErrorHandeler(async (req, res, next) => {
  const classId = req.params.id;
  validationData(classId);

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  const setString = fields.map((e, i) => `${e} = $${i + 1}`);
  values.push(classId);

  const query = `
  UPDATE class 
  SET ${setString} WHERE id = $${values.length} AND active = true
  RETURNING *`;

  const Class = await client.query(query, values);

  if (!Class.rowCount) {
    return next(new customError("class not found", 404));
  }

  classResponse(res, 200, { class: Class.rows[0] });
});

exports.deleteClass = asyncErrorHandeler(async (req, res, next) => {
  const classId = req.params.id;
  validationData(classId);

  let query = `UPDATE class SET active = false WHERE id = $1 AND active = true`;
  let values = [classId];
  const Class = await client.query(query, values);

  query = "DELETE FROM classSubjects WHERE class_id = $1";

  await client.query(query, values);

  if (!Class.rowCount) {
    return next(new customError("class not found", 404));
  }

  classResponse(res, 200, { message: "class has deleted" });
});

exports.getClassSubjects = asyncErrorHandeler(async (req, res, next) => {
  const classId = req.params.id;
  validationData(classId);

  const features = new apiFeatures(
    req.query,
    ["s.name"],
    ["s.name"],
    ["s.name", "s.description"],
    [classId],
  );

  const { whereClause, orderClause, paginationClause, values } = features
    .filter()
    .search()
    .sort()
    .paginate()
    .build();

  const query = `
  SELECT 
  s.id AS subject_id,
  s.name AS subject_name,
  s.description AS subject_description,
  s.is_core AS is_core
  FROM classSubjects cs
  JOIN class c on cs.class_id = c.id
  JOIN subject s on cs.subject_id = s.id
  WHERE cs.class_id = $1 
  AND c.active = true 
  AND s.active = true
  ${whereClause}
  ${orderClause}
  ${paginationClause}`;

  const subjects = await client.query(query, values);

  if (!subjects.rowCount) {
    return next(new customError("subjects not found", 404));
  }

  classResponse(res, 200, { subjects: subjects.rows });
});

exports.getClassStudents = asyncErrorHandeler(async (req, res, next) => {
  const classId = req.params.id;
  validationData(classId);

  let query = `
  SELECT 
  s.name AS student_name,
  s.email AS student_email,
  s.gender AS student_gender,
  s.age AS student_age
  FROM enrollment e 
  JOIN class c on e.class_id = c.id
  JOIN student s on e.student_id = s.id
  WHERE e.class_id = $1 
  AND c.active = true 
  AND s.active = true 
  AND e.active = true`;

  let v1 = [classId];

  if (req.user.role === "teacher") {
    const teacher = await client.query(
      `SELECT * FROM teacher WHERE user_id = $1`,
      [req.user.id],
    );

    if (!teacher.rowCount) {
      return next(new customError("teacher not found", 404));
    }

    query = `
  SELECT 
  s.id AS student_id,
  s.name AS student_name,
  s.email AS student_email,
  s.gender AS student_gender,
  s.age AS student_age
  FROM enrollment e 
  JOIN class c on e.class_id = c.id
  JOIN student s on e.student_id = s.id
  JOIN classSubjects cs on cs.class_id = c.id
  JOIN teacher t on cs.teacher_id = t.id
  WHERE e.class_id = $1 
  AND c.active = true 
  AND s.active = true 
  AND e.active = true
  AND t.id = $2`;

    v1.push(teacher.rows[0].id);
  }

  const features = new apiFeatures(
    req.query,
    ["s.age", "s.gender"],
    ["s.age", "s.gender"],
    ["s.name", "s.email", "s.gender"],
    [...v1],
  );

  const { whereClause, orderClause, paginationClause, values } = features
    .filter()
    .search()
    .sort()
    .paginate()
    .build();

  const fQuery = `${query}
  ${whereClause}
  ${orderClause}
  ${paginationClause}`;

  const students = await client.query(fQuery, values);

  if (!students.rowCount) {
    return next(new customError("students not found", 404));
  }

  classResponse(res, 200, { students: students.rows });
});

exports.getClassTeachers = asyncErrorHandeler(async (req, res, next) => {
  const classId = req.params.id;
  validationData(classId);

  const query = `
  SELECT 
  t.name AS teacher_name,
  s.name AS subject_name
  FROM classSubjects cs
  JOIN class c on cs.class_id = c.id
  JOIN teacher t on cs.teacher_id = t.id
  JOIN subject s on t.subject_id = s.id
  WHERE cs.class_id = $1 AND c.active = true AND t.active = true `;

  const values = [classId];

  const teachers = await client.query(query, values);

  if (!teachers.rowCount) {
    return next(new customError("teachers not found", 404));
  }

  classResponse(res, 200, { teachers: teachers.rows });
});

exports.getAttendanceOfClass = asyncErrorHandeler(async (req, res, next) => {
  const { classId, day } = req.body;
  validationData(classId, day);

  let query = `SELECT 
  a.id AS id,
  s.name AS student_name,
  a.status AS attendance_status
  FROM enrollment e
  JOIN class c on e.class_id = c.id
  JOIN student s on e.student_id = s.id
  JOIN attendance a on a.student_id = s.id
  JOIN classSubjects cs on cs.class_id = c.id
  JOIN teacher t on cs.teacher_id = t.id
  WHERE e.class_id = $1
  AND a.attendance_date = $2
  AND c.active = true
  AND s.active = true
  AND a.active = true
  AND e.active = true`;

  let v1 = [classId, day];

  if (req.user.role === "teacher") {
    const teacher = await client.query(
      `SELECT * FROM teacher WHERE user_id = $1`,
      [req.user.id],
    );

    if (!teacher.rowCount) {
      return next(new customError("teacher not found", 404));
    }

    query += " AND t.id = $3";
    v1.push(teacher.rows[0].id);
  }

  const features = new apiFeatures(
    req.query,
    ["a.status"],
    ["a.status"],
    ["s.name", "a.status"],
    [...v1],
  );

  const { whereClause, orderClause, paginationClause, values } = features
    .filter()
    .search()
    .sort()
    .paginate()
    .build();

  const fQuery = `${query}
  ${whereClause}
  ${orderClause}
  ${paginationClause}`;

  const attendance = await client.query(fQuery, values);

  if (!attendance.rowCount) {
    return next(new customError("attendance not found", 404));
  }

  classResponse(res, 200, { attendance: attendance.rows });
});

exports.getGradesOfClass = asyncErrorHandeler(async (req, res, next) => {
  const { classId, subjectId } = req.body;
  validationData(classId);

  let query = `
  SELECT
  g.id AS id,
  s.name AS student_name,
  g.exam_type AS exam_type,
  g.score AS score,
  g.max_score AS max_score,
  ROUND((g.score::numeric / NULLIF(g.max_score, 0)) * 100, 2) AS percentage,
  sb.name AS subject_name,
  t.name AS teacher_name
  
  FROM enrollment e
  JOIN class c ON e.class_id = c.id
  JOIN student s ON e.student_id = s.id
  JOIN grades g ON g.student_id = s.id
  JOIN classSubjects cs ON g.class_subject_id = cs.id
  JOIN subject sb ON cs.subject_id = sb.id
  JOIN teacher t ON cs.teacher_id = t.id
  WHERE e.class_id = $1
  AND cs.class_id = e.class_id
  AND c.active = true
  AND e.active = true
  AND s.active = true
  AND g.active = true
  AND sb.active = true
  AND t.active = true`;

  const values = [classId];

  if (req.user.role === "teacher") {
    const teacher = await client.query(
      `SELECT id FROM teacher WHERE user_id = $1 AND active = true`,
      [req.user.id],
    );

    if (!teacher.rowCount) {
      return next(new customError("teacher not found", 404));
    }

    query += ` AND cs.teacher_id = $${values.length + 1}`;
    values.push(teacher.rows[0].id);
  } else if (subjectId !== undefined) {
    validationData(subjectId);
    query += ` AND cs.subject_id = $${values.length + 1}`;
    values.push(subjectId);
  }

  const features = new apiFeatures(
    req.query,
    ["s.name", "g.score", "g.exam_type"],
    ["s.name", "g.score", "g.exam_type"],
    ["s.name", "sb.name", "g.exam_type"],
    [...values],
  );

  const {
    whereClause,
    orderClause,
    paginationClause,
    values: queryValues,
  } = features.filter().search().sort().paginate().build();

  const grades = await client.query(
    `${query}
    ${whereClause}
    ${orderClause}
    ${paginationClause}`,
    queryValues,
  );

  if (!grades.rowCount) {
    return next(new customError("grades not found", 404));
  }

  classResponse(res, 200, { grades: grades.rows });
});
