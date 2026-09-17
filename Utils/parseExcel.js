const xlsx = require("xlsx");

exports.parseExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return xlsx.utils.sheet_to_json(sheet, { defval: null });
};
