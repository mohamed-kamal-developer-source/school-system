const client = require("../pg");
const customError = require("../Utils/customError");
const asyncErrorHandeler = require("../Utils/asyncErrorHandeler");
const { object } = require("webidl-conversions");
const validationData = require("../Utils/validation");
const apiFeatures = require("../Utils/apiFeatures");

const subjectResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: "success",
    data,
  });
};

exports.getAllSubjects = asyncErrorHandeler(async (req, res, next) => {
  const features = new apiFeatures(
    req.query,
    ["name"],
    ["name"],
    ["name", "description"],
  );

  const { whereClause, orderClause, paginationClause, values } = features
    .filter()
    .search()
    .sort()
    .paginate()
    .build();

  const query = `
  SELECT * FROM subject 
  WHERE active = true
  ${whereClause}
  ${orderClause}
  ${paginationClause}
  `;
  
  const subjects = await client.query(query, values);

  if (!subjects.rowCount) {
    return next(new customError("no subjects found", 404));
  }

  subjectResponse(res, 200, { subjects: subjects.rows });
});

exports.createSubject = asyncErrorHandeler(async (req, res, next) => {
  const { name, description, isCore } = req.body;
  validationData(name, description, isCore);

  const query = `
    INSERT INTO subject 
    (name, description, is_core)
    VALUES ($1,$2,$3)
    RETURNING *`;

  const values = [name, description, isCore];
  const subject = await client.query(query, values);

  if (!subject.rowCount) {
    return next(new customError("subject not created. please try again", 404));
  }

  subjectResponse(res, 201, { subject: subject.rows[0] });
});

exports.getOneSubject = asyncErrorHandeler(async (req, res, next) => {
  const subjectId = req.params.id;
  validationData(subjectId);

  const query = `SELECT * FROM subject WHERE id = $1 AND active = true`;
  const values = [subjectId];

  const subject = await client.query(query, values);

  if (!subject.rowCount) {
    return next(new customError("subject not found", 404));
  }

  subjectResponse(res, 200, { subject: subject.rows[0] });
});

exports.updateSubject = asyncErrorHandeler(async (req, res, next) => {
  const subjectId = req.params.id;
  validationData(subjectId);

  const fields = Object.keys(req.body);
  const values = Object.values(req.body);

  const setString = fields.map((e, i) => `${e} = $${i + 1}`);
  values.push(subjectId);

  const query = `
  UPDATE subject 
  SET ${setString} WHERE id = $${values.length} AND active = true
  RETURNING *`;

  const subject = await client.query(query, values);

  if (!subject.rowCount) {
    return next(new customError("subject not found", 404));
  }

  subjectResponse(res, 200, { subject: subject.rows[0] });
});

exports.deleteSubject = asyncErrorHandeler(async (req, res, next) => {
  const subjectId = req.params.id;
  validationData(subjectId);

  const query = `UPDATE subject SET active = false WHERE id = $1`;
  const values = [subjectId];
  const subject = await client.query(query, values);

  if (!subject.rowCount) {
    return next(new customError("subject not found", 404));
  }

  subjectResponse(res, 200, { message: "subject has deleted" });
});

exports.getSubjectClasses = asyncErrorHandeler(async (req, res, next) => {
  const subjectId = req.params.id;
  validationData(subjectId);

  const query = `
  SELECT 
  c.* AS class_details
  FROM classSubjects cs
  JOIN class c on cs.class_id = c.id
  JOIN subject s on cs.subject_id = s.id
  WHERE cs.subject_id = $1 AND s.active = true AND c.active = true `;

  const values = [subjectId];

  const classes = await client.query(query, values);

  if (!classes.rowCount) {
    return next(new customError("classes not found", 404));
  }

  subjectResponse(res, 200, { classes: classes.rows });
});

exports.getSubjectTeachers = asyncErrorHandeler(async (req, res, next) => {
  const subjectId = req.params.id;
  validationData(subjectId);

  const query = `
  SELECT 
  t.*
  FROM classSubjects cs
  JOIN teacher t on cs.teacher_id = t.id
  JOIN subject s on t.subject_id = s.id
  WHERE cs.subject_id = $1 AND s.active = true AND t.active = true `;

  const values = [subjectId];

  const teachers = await client.query(query, values);

  if (!teachers.rowCount) {
    return next(new customError("teachers not found", 404));
  }

  subjectResponse(res, 200, { teachers: teachers.rows });
});
