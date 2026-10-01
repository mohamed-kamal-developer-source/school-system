// app.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const customError = require("./Utils/customError");
const errorHandeler = require("./controllers/errorContoller");

// Routers
const userRouter = require("./Routers/userRouter");
const studentRouter = require("./Routers/studentRouter");
const teacherRouter = require("./Routers/teacherRouter");
const subjectRouter = require("./Routers/subjectRouter");
const classRouter = require("./Routers/classRouter");
const classSubjectsRouter = require("./Routers/classSubjectsRouter");
const adminRouter = require("./Routers/adminRouter");
const paymentRouter = require("./Routers/paymentRouter");

const app = express();

// ------------------------
// 1️⃣ CORS Setup
// ------------------------
const corsOptions = {
  origin: [
    'http://localhost:3232',   // الستاتيك فرونت (لو بتفتحه من نفس البورت مش لازم أصلاً)
    'http://localhost:3000',   // Next.js في وضع التطوير (البورت الافتراضي بتاعه)
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    if (corsOptions.origin.includes(req.headers.origin)) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    }
    return res.sendStatus(200);
  }
  next();
});

// ------------------------
// 2️⃣ Body parser
// ------------------------
app.use(express.json());

// ------------------------
// 3️⃣ Static frontend
// ------------------------
const frontendPath = path.join(__dirname, "school-management-frontend");
app.use(express.static(frontendPath));

// ------------------------
// 4️⃣ Routers
// ------------------------
app.use("/api/v1/users", userRouter);
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/teacher", teacherRouter);
app.use("/api/v1/subject", subjectRouter);
app.use("/api/v1/class", classRouter);
app.use("/api/v1/classSubjects", classSubjectsRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/payments", paymentRouter);

// ------------------------
// 5️⃣ Handle unknown routes
// ------------------------
app.all(/(.*)/, (req, res, next) => {
  const err = new customError(
    `Cannot find this URL => ${req.originalUrl}, please try again`,
    404
  );
  next(err);
});

// ------------------------
// 6️⃣ Global error handler
// ------------------------
app.use(errorHandeler);

module.exports = app;
