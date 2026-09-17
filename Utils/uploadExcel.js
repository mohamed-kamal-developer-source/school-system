const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const uploadExcel = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];

    const isExcelExtension = [".xlsx", ".xls"].includes(
      path.extname(file.originalname).toLowerCase(),
    );

    if (allowedTypes.includes(file.mimetype) || isExcelExtension) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = uploadExcel;
