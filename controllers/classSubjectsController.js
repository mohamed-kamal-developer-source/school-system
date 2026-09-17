const client = require("../pg");
const customError = require("../Utils/customError");
const asyncErrorHandeler = require("../Utils/asyncErrorHandeler");
const { object } = require("webidl-conversions");
const validationData = require("../Utils/validation");

const classSubjectsResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: "success",
    data,
  });
};

exports.createClassSubjects = asyncErrorHandeler(async (req, res, next) => {
  const { classId, teacherId, weeklyHours } = req.body;
  validationData(classId, teacherId, weeklyHours);

  let query = `SELECT subject_id FROM teacher WHERE id = $1 AND active = true`;
  const subjectId = await client.query(query, [teacherId]);

  if (!subjectId.rowCount) {
    return next(new customError("please try again", 404));
  }

  query = `
    INSERT INTO classSubjects 
    (class_id, subject_id, teacher_id, weekly_hours)
    VALUES ($1,$2,$3,$4)
    RETURNING *`;

  const values = [classId, subjectId.rows[0].subject_id, teacherId, weeklyHours];

  const classSubjects = await client.query(query, values);

  if (!classSubjects.rowCount) {
    return next(
      new customError("classSubjects not created. please try again", 404),
    );
  }

  classSubjectsResponse(res, 201, { classSubjects: classSubjects.rows[0] });
});

exports.getClassSubjects = asyncErrorHandeler(async (req, res, next) => {
  const classId = req.params.id;
  validationData(classId);

  const query = `
  SELECT
  cs.id,
  cs.weekly_hours,
  c.grade_level AS class_grade_level,
  c.group_name AS class_group_name,
  c.room_number AS class_room_number,
  s.name AS subject_name,
  t.id AS teacher_id,
  t.name AS teacher_name
  FROM classSubjects cs
  JOIN class c on cs.class_id = c.id
  JOIN subject s on cs.subject_id = s.id
  JOIN teacher t on cs.teacher_id = t.id
  WHERE cs.class_id = $1 AND t.active = true AND s.active = true AND c.active = true`;

  const values = [classId];

  const classSubjects = await client.query(query, values);

  if (!classSubjects.rowCount) {
    return next(new customError("classSubjects not found", 404));
  }

  classSubjectsResponse(res, 200, { classSubjects: classSubjects.rows });
});

exports.updateClassSubjects = asyncErrorHandeler(async (req, res, next) => {
  const classSubjectsId = req.params.id;
  validationData(classSubjectsId);

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  const setString = fields.map((e, i) => `${e} = $${i + 1}`);
  values.push(classSubjectsId);

  const query = `
  UPDATE classSubjects 
  SET ${setString} 
  WHERE id = $${values.length}
  RETURNING *`;

  const classSubjects = await client.query(query, values);

  if (!classSubjects.rowCount) {
    return next(new customError("classSubjects not found", 404));
  }

  classSubjectsResponse(res, 200, { classSubjects: classSubjects.rows[0] });
});

exports.deleteTeacherFromClass = asyncErrorHandeler(async (req, res, next) => {
  const { teacherId, classId } = req.body;
  validationData(teacherId, classId);

  const query = `
  DELETE FROM classSubjects cs
  USING teacher t,class c
  WHERE cs.teacher_id = t.id
  AND cs.class_id = c.id
  AND cs.teacher_id = $1
  AND cs.class_id = $2
  AND t.active = true
  AND c.active = true`;

  const values = [teacherId, classId];

  const result = await client.query(query, values);

  if (!result.rowCount) {
    return next(new customError("this teacher is not exist in this class", 404));
  }

  classSubjectsResponse(res, 200, {
    message: "teacher has deleted from this class",
  });
});
