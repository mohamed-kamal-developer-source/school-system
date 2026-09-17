const client = require("../pg");
const customError = require("../Utils/customError");
const asyncErrorHandeler = require("../Utils/asyncErrorHandeler");
const { object } = require("webidl-conversions");
const bcrypt = require("bcryptjs");
const validationData = require("../Utils/validation");
const apiFeatures = require("../Utils/apiFeatures");
const { readExcelRows, required, toDate } = require("../Utils/bulkExcel");

const teacherResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: "success",
    data,
  });
};

const getTeacherForImport = async (userId) => {
  const result = await client.query(
    "SELECT id FROM teacher WHERE user_id = $1 AND active = true",
    [userId],
  );
  if (!result.rowCount) throw new customError("teacher not found", 404);
  return result.rows[0].id;
};

const getTeacherClassSubject = async (teacherId, studentId) => {
  const result = await client.query(
    `SELECT cs.id AS class_subject_id, e.class_id
     FROM enrollment e
     JOIN classsubjects cs ON cs.class_id = e.class_id
     WHERE e.student_id = $1
       AND e.active = TRUE
       AND cs.teacher_id = $2
     LIMIT 1`,
    [studentId, teacherId],
  );
  if (!result.rowCount) {
    throw new customError(
      `Student ${studentId} is not enrolled in one of your assigned classes`,
      403,
    );
  }
  return result.rows[0];
};

exports.bulkAddGrades = asyncErrorHandeler(async (req, res, next) => {
  if (req.user.role !== "teacher") {
    return next(new customError("Only the assigned teacher can import grades", 403));
  }
  const rows = readExcelRows(req.file);
  const teacherId = await getTeacherForImport(req.user.id);
  const prepared = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    required(row, ["student_id", "exam_type", "score", "max_score"], rowNumber);
    const score = Number(row.score);
    const maxScore = Number(row.max_score);
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || score < 0 || maxScore <= 0 || score > maxScore) {
      return next(new customError(`Row ${rowNumber}: score must be between 0 and max_score`, 400));
    }
    const assignment = await getTeacherClassSubject(teacherId, row.student_id);
    prepared.push({
      studentId: row.student_id,
      classSubjectId: assignment.class_subject_id,
      examType: String(row.exam_type).trim(),
      score,
      maxScore,
      recordedAt: row.recorded_at ? toDate(row.recorded_at, rowNumber, "recorded_at") : new Date().toISOString(),
    });
  }

  await client.query("BEGIN");
  try {
    for (const grade of prepared) {
      await client.query(
        `INSERT INTO grades
          (student_id, class_subject_id, exam_type, score, max_score, recorded_by, recorded_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [grade.studentId, grade.classSubjectId, grade.examType, grade.score, grade.maxScore, teacherId, grade.recordedAt],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
  teacherResponse(res, 201, { imported: prepared.length, message: "Grades imported successfully" });
});

exports.bulkAddAttendance = asyncErrorHandeler(async (req, res, next) => {
  if (req.user.role !== "teacher") {
    return next(new customError("Only the assigned teacher can import attendance", 403));
  }
  const rows = readExcelRows(req.file);
  const teacherId = await getTeacherForImport(req.user.id);
  const allowedStatuses = new Set(["present", "absent", "late", "excused"]);
  const prepared = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    required(row, ["student_id", "status"], rowNumber);
    const status = String(row.status).trim().toLowerCase();
    if (!allowedStatuses.has(status)) {
      return next(new customError(`Row ${rowNumber}: invalid attendance status`, 400));
    }
    const assignment = await getTeacherClassSubject(teacherId, row.student_id);
    prepared.push({
      studentId: row.student_id,
      classId: assignment.class_id,
      status,
      attendanceDate: row.attendance_date
        ? toDate(row.attendance_date, rowNumber, "attendance_date")
        : new Date().toISOString().slice(0, 10),
    });
  }

  await client.query("BEGIN");
  try {
    for (const attendance of prepared) {
      await client.query(
        `INSERT INTO attendance (student_id, class_id, attendance_date, recorded_by, status)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (student_id, class_id, attendance_date) WHERE active = TRUE
         DO UPDATE SET status = EXCLUDED.status, recorded_by = EXCLUDED.recorded_by, updated_at = NOW()`,
        [attendance.studentId, attendance.classId, attendance.attendanceDate, teacherId, attendance.status],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
  teacherResponse(res, 201, { imported: prepared.length, message: "Attendance imported successfully" });
});

const validateData = async (req, studentId) => {
  let query = `SELECT * FROM teacher WHERE user_id = $1`;
  let values = [req.user.id];

  const teacher = await client.query(query, values);

  if (!teacher.rowCount) {
    throw new customError("no teacher found", 404);
  }

  const teacherId = teacher.rows[0].id;
  const subjectId = teacher.rows[0].subject_id;

  query = `
    SELECT class_id 
    FROM enrollment
    WHERE student_id = $1
    AND active = true
  `;
  values = [studentId];

  const enrollment = await client.query(query, values);

  if (!enrollment.rowCount) {
    throw new customError("student is not enrolled in any active class", 404);
  }

  const classId = enrollment.rows[0].class_id;

  query = `
    SELECT id 
    FROM classSubjects
    WHERE class_id = $1
    AND teacher_id = $2
  `;
  values = [classId, teacherId];

  const classSubjects = await client.query(query, values);

  if (!classSubjects.rowCount) {
    throw new customError("teacher is not assigned to this class", 403);
  }

  return {
    teacherId,
    classId,
    classSubjectsId: classSubjects.rows[0].id,
    subjectId,
  };
};

exports.getAllTeachers = asyncErrorHandeler(async (req, res, next) => {
  const features = new apiFeatures(
    req.query,
    ["name", "email", "hire_date"],
    ["name", "hire_date"],
    ["name", "email", "hire_date"],
  );

  const { whereClause, orderClause, paginationClause, values } = features
    .filter()
    .search()
    .sort()
    .paginate()
    .build();

  const query = `
  SELECT t.*,
  s.name AS subject_name
  from teacher t 
  JOIN subject s on t.subject_id = s.id
  WHERE t.active = true
  ${whereClause}
  ${orderClause}
  ${paginationClause}
  `;
  const teachers = await client.query(query, values);

  if (!teachers.rowCount) {
    return next(new customError("no teachers found", 404));
  }

  teacherResponse(res, 200, { teachers: teachers.rows });
});

exports.createTeacher = asyncErrorHandeler(async (req, res, next) => {
  const { name, email, subjectId, hire_date, confirmPassword, role } = req.body;
  let password = req.body.password;
  validationData(
    name,
    email,
    subjectId,
    hire_date,
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
    INSERT INTO teacher 
    (name,email,hire_date,subject_id,user_id)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *`;

  values = [name, email, hire_date, subjectId, userId];
  const teacher = await client.query(query, values);

  if (!teacher.rowCount) {
    return next(new customError("teacher not created. please try again", 404));
  }

  teacherResponse(res, 201, { teacher: teacher.rows[0] });
});

exports.getOneTeacher = asyncErrorHandeler(async (req, res, next) => {
  const teacherId = req.params.id;
  validationData(teacherId);

  const query = `SELECT t.*,
  s.name AS subject_name
  from teacher t 
  JOIN subject s on t.subject_id = s.id
   WHERE t.id = $1 AND t.active = true`;

  const values = [teacherId];

  const teacher = await client.query(query, values);

  if (!teacher.rowCount) {
    return next(new customError("teacher not found", 404));
  }

  teacherResponse(res, 200, { teacher: teacher.rows[0] });
});

exports.updateTeacher = asyncErrorHandeler(async (req, res, next) => {
  const teacherId = req.params.id;
  validationData(teacherId);

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  const setString = fields.map((e, i) => `${e} = $${i + 1}`);
  values.push(teacherId);

  const query = `
  UPDATE teacher 
  SET ${setString} WHERE id = $${values.length} AND active = true
  RETURNING *`;

  const teacher = await client.query(query, values);

  if (!teacher.rowCount) {
    return next(new customError("teacher not found", 404));
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
    values.push(teacher.rows[0].user_id);

    const setString = fields.map((e, i) => `${e} = $${i + 1}`);

    await client.query(
      `UPDATE users 
    SET ${setString}
    WHERE id = $${values.length} AND active = true`,
      values,
    );
  }

  teacherResponse(res, 200, { teacher: teacher.rows[0] });
});

exports.deleteTeacher = asyncErrorHandeler(async (req, res, next) => {
  const teacherId = req.params.id;
  validationData(teacherId);

  let query = `SELECT user_id FROM teacher WHERE id = $1 AND active = true`;
  let values = [teacherId];
  const teacher = await client.query(query, values);

  if (!teacher.rowCount) {
    return next(new customError("teacher not found", 404));
  }

  query = `UPDATE teacher SET active = false WHERE id = $1 AND active = true`;
  await client.query(query, values);

  query = `
    UPDATE users SET active = false WHERE id = $1 AND active = true`;

  values = [teacher.rows[0].user_id];

  const user = await client.query(query, values);

  if (!user.rowCount) {
    return next(new customError("no user found", 404));
  }

  teacherResponse(res, 200, { message: "teacher has deleted" });
});

exports.addGradeforStudent = asyncErrorHandeler(async (req, res, next) => {
  const { examType, score, maxScore, recordedAt, studentId } = req.body;
  validationData(examType, score, maxScore, recordedAt, studentId);

  if (req.user.role === "admin") {
    validationData(req.body.userId);
    req.user.id = req.body.userId;
  }

  const data = await validateData(req, studentId);
  const teacherId = data.teacherId;

  query = `
  INSERT INTO grades
  (student_id,class_subject_id,exam_type,score,max_score,recorded_by,recorded_at)
  VALUES ($1,$2,$3,$4,$5,$6,$7)
  RETURNING *`;

  values = [
    studentId,
    data.classSubjectsId,
    examType,
    score,
    maxScore,
    teacherId,
    recordedAt,
  ];

  const grade = await client.query(query, values);

  if (!grade.rowCount) {
    return next(new customError("an error please try again!", 404));
  }

  teacherResponse(res, 200, { message: "grade added succesfully" });
});

exports.updateGradeForStudent = asyncErrorHandeler(async (req, res, next) => {
  const gradeId = req.params.id;
  validationData(gradeId, req.body.student_id);

  if (req.user.role === "admin") {
    validationData(req.body.userId);
    req.user.id = req.body.userId;
  }

  const data = await validateData(req, req.body.student_id);
  delete req.body.userId;

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  const setString = fields.map((e, i) => `${e} = $${i + 1}`);
  values.push(gradeId);
  values.push(data.teacherId);

  const query = `
  UPDATE grades 
  SET ${setString} 
  WHERE id = $${values.length - 1} 
  AND recorded_by = $${values.length}
  AND active = true
  RETURNING *`;

  const grade = await client.query(query, values);

  if (!grade.rowCount) {
    return next(new customError("grade not found", 404));
  }

  teacherResponse(res, 200, { grade: grade.rows[0] });
});

exports.addAttendanceForStudent = asyncErrorHandeler(async (req, res, next) => {
  const { student_id, attendance_date, status } = req.body;
  validationData(student_id, attendance_date, status);

  if (req.user.role === "admin") {
    validationData(req.body.userId);
    req.user.id = req.body.userId;
  }

  const data = await validateData(req, student_id);
  const teacherId = data.teacherId;

  const query = `
  INSERT INTO attendance 
  (student_id,class_id,attendance_date,recorded_by,status)
  VALUES ($1,$2,$3,$4,$5)
  RETURNING *`;

  const values = [student_id, data.classId, attendance_date, teacherId, status];

  const attendance = await client.query(query, values);

  if (!attendance.rowCount) {
    return next(new customError("an error please try again!", 404));
  }

  teacherResponse(res, 200, { message: "attendance added successfully" });
});

exports.updateAttendanceForStudent = asyncErrorHandeler(
  async (req, res, next) => {
    const attendanceId = req.params.id;
    validationData(attendanceId, req.body.student_id);

    if (req.user.role === "admin") {
      validationData(req.body.userId);
      userId = req.body.userId;
      req.user.id = userId;
    }

    const data = await validateData(req, req.body.student_id);
    delete req.body.userId;

    const fields = Object.keys(req.body);
    const values = Object.values(req.body);

    const setString = fields.map((e, i) => `${e} = $${i + 1}`);

    values.push(attendanceId);
    values.push(data.teacherId);

    const query = `
  UPDATE attendance a
  SET ${setString} 
  WHERE a.id = $${values.length - 1} 
  AND a.recorded_by = $${values.length}
  AND active = true
  RETURNING *`;

    const attendance = await client.query(query, values);

    if (!attendance.rowCount) {
      return next(new customError("attendance not found", 404));
    }

    teacherResponse(res, 200, { attendance: attendance.rows[0] });
  },
);

exports.deleteGrade = asyncErrorHandeler(async (req, res, next) => {
  const gradeId = req.params.id;
  validationData(gradeId);

  let query = `
  UPDATE grades 
  SET active = false 
  WHERE id = $1
  AND active = true`;

  let values = [gradeId];

  let teacherId;
  if (req.user.role === "teacher") {
    const teacher = await client.query(
      `SELECT * FROM teacher WHERE user_id = $1`,
      [req.user.id],
    );

    if (!teacher.rowCount) {
      return next(new customError("teacher not found", 404));
    }

    teacherId = teacher.rows[0].id;

    query += " AND recorded_by = $2";
    values.push(teacherId);
  }

  const result = await client.query(query, values);

  if (!result.rowCount) {
    return next(new customError("grade not found", 404));
  }

  teacherResponse(res, 200, { message: "grade deleted successfully" });
});

exports.deleteAttendance = asyncErrorHandeler(async (req, res, next) => {
  const attendanceId = req.params.id;
  validationData(attendanceId);

  let query = `
  UPDATE attendance 
  SET active = false 
  WHERE id = $1
  AND active = true`;

  let values = [attendanceId];

  let teacherId;
  if (req.user.role === "teacher") {
    const teacher = await client.query(
      `SELECT * FROM teacher WHERE user_id = $1`,
      [req.user.id],
    );

    if (!teacher.rowCount) {
      return next(new customError("teacher not found", 404));
    }

    teacherId = teacher.rows[0].id;

    query += " AND recorded_by = $2";
    values.push(teacherId);
  }

  const result = await client.query(query, values);

  if (!result.rowCount) {
    return next(new customError("attendance not found", 404));
  }

  teacherResponse(res, 200, { message: "attendance deleted successfully" });
});

exports.getTeacherClassses = asyncErrorHandeler(async (req, res, next) => {
  let teacherId;

  if (req.user.role === "teacher") {
    let query = `SELECT * FROM teacher WHERE user_id = $1`;
    let values = [req.user.id];

    const teacher = await client.query(query, values);

    if (!teacher.rowCount) {
      return next(new customError("teacher not found", 404));
    }
    teacherId = teacher.rows[0].id;
  }

  if (req.user.role === "admin") {
    validationData(req.body.teacherId);
    teacherId = req.body.teacherId;
  }

  query = `
  SELECT c.* AS class
  FROM classSubjects cs
  JOIN class c on cs.class_id = c.id
  WHERE cs.teacher_id = $1`;
  values = [teacherId];

  const classes = await client.query(query, values);

  if (!classes.rowCount) {
    return next(new customError("classes not found", 404));
  }

  teacherResponse(res, 200, { classes: classes.rows });
});

exports.getGradesOfClass = asyncErrorHandeler(async (req, res, next) => {
  const { classId } = req.body;
  validationData(classId);

  let query = `
  SELECT
  g.id AS id,
  s.name AS student_name,
  g.score AS score,
  g.max_score AS max_score,
  sb.name AS subject_name,
  t.name AS teacher_name
  FROM enrollment e
  JOIN student s on e.student_id = s.id
  JOIN class c on e.class_id = c.id
  JOIN grades g on s.id = g.student_id
  JOIN classSubjects cs on g.class_subject_id = cs.id
  JOIN subject sb on cs.subject_id = sb.id
  JOIN teacher t on cs.teacher_id = t.id
  WHERE c.id = $1
  AND sb.id = $2
  AND g.active = true
  `;
  let v1 = [classId];

  let subjectId;
  let teacherId;

  if (req.user.role === "teacher") {
    const teacher = await client.query(
      `SELECT * FROM teacher WHERE user_id = $1`,
      [req.user.id],
    );

    if (!teacher.rowCount) {
      return next(new customError("teacher not found", 404));
    }

    subjectId = teacher.rows[0].subject_id;
    teacherId = teacher.rows[0].id;

    query += " AND t.id = $3";
    v1.push(subjectId);
    v1.push(teacherId);
  }
  if (req.user.role === "admin") {
    validationData(req.body.subjectId);
    subjectId = req.body.subjectId;
    v1.push(subjectId);
  }

  const features = new apiFeatures(
    req.query,
    ["s.name", "g.score"],
    ["s.name", "g.score"],
    ["s.name"],
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

  const grades = await client.query(fQuery, values);

  if (!grades.rowCount) {
    return next(new customError("grades not found", 404));
  }

  teacherResponse(res, 200, { grades: grades.rows });
});
