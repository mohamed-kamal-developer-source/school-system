const { parseExcel } = require("./parseExcel");
const customError = require("../Utils/customError");

const normaliseKey = (key) =>
  String(key)
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();

const normaliseRow = (row) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normaliseKey(key), value]),
  );

const readExcelRows = (file) => {
  if (!file || !file.buffer) {
    throw new customError("An Excel file is required in the 'file' field", 400);
  }

  const rows = parseExcel(file.buffer).map(normaliseRow);
  if (!rows.length) {
    throw new customError("The Excel file does not contain any data rows", 400);
  }
  if (rows.length > 500) {
    throw new customError("A single import can contain at most 500 rows", 400);
  }
  return rows;
};

const required = (row, fields, rowNumber) => {
  const missing = fields.filter(
    (field) =>
      row[field] === undefined || row[field] === null || row[field] === "",
  );
  if (missing.length) {
    throw new customError(
      `Row ${rowNumber}: missing required columns: ${missing.join(", ")}`,
      400,
    );
  }
};

const toDate = (value, rowNumber, field) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new customError(
      `Row ${rowNumber}: ${field} must be a valid date`,
      400,
    );
  }
  return date.toISOString().slice(0, 10);
};

module.exports = { readExcelRows, required, toDate };
