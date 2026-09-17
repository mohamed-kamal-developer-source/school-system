class AppSections {
  /* ─── SUBJECTS ─── */
  static async loadSubjects() {
    const cw = document.getElementById("contentWrapper");
    const user = Auth.getUser();
    const isAdmin = user.role === "admin";
    cw.innerHTML = `<div class="section-header"><h2>Subjects</h2>${isAdmin ? '<button class="btn btn-primary" id="createBtn">+ Create Subject</button>' : ""}</div><div class="card"><div id="subjectsTable"></div></div>`;
    try {
      showLoading();
      const r = await API.get("/subject");
      const subjects = r.data.subjects || [];
      const actions = isAdmin
        ? [
            {
              icon: "✏️",
              class: "btn-update",
              action: "update",
              label: "Update",
            },
            {
              icon: "🗑️",
              class: "btn-delete",
              action: "delete",
              label: "Delete",
            },
            {
              icon: "🏫",
              class: "btn-view",
              action: "viewClasses",
              label: "View Classes",
            },
            {
              icon: "👨‍🏫",
              class: "btn-view",
              action: "viewTeachers",
              label: "View Teachers",
            },
          ]
        : [];
      const table = new DataTable({
        data: subjects,
        columns: [
          { field: "id", label: "#" },
          { field: "name", label: "Subject Name" },
          { field: "description", label: "Description" },
          {
            field: "is_core",
            label: "Type",
            format: (v) =>
              v
                ? '<span class="badge badge-success">Core</span>'
                : '<span class="badge badge-info">Elective</span>',
          },
        ],
        actions,
        containerId: "subjectsTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.onAction = (action, id) =>
        this.handleAction(action, "subject", id, subjects);
      table.render();
      if (isAdmin)
        document
          .getElementById("createBtn")
          ?.addEventListener("click", () => Forms.showSubjectForm());
    } catch (e) {
      Toast.show("Failed to load subjects", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadSubjectClasses(subjectId, subjectName) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Classes for: ${subjectName}</h2><button class="btn btn-secondary" id="backBtn">← Back</button></div><div class="card"><div id="subjectClassesTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadSubjects());
    try {
      showLoading();
      const r = await API.get(`/subject/getClasses/${subjectId}`);
      const classes = r.data.classes || [];
      const table = new DataTable({
        data: classes,
        columns: [
          { field: "id", label: "#" },
          { field: "grade_level", label: "Grade" },
          { field: "group_name", label: "Group" },
          { field: "room_number", label: "Room" },
          { field: "academic_year", label: "Academic Year" },
          {
            field: "active",
            label: "Status",
            format: (v) => (v ? "Active" : "Inactive"),
          },
        ],
        actions: [],
        containerId: "subjectClassesTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load classes", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadSubjectTeachers(subjectId, subjectName) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Teachers for: ${subjectName}</h2><button class="btn btn-secondary" id="backBtn">← Back</button></div><div class="card"><div id="subjectTeachersTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadSubjects());
    try {
      showLoading();
      const r = await API.get(`/subject/getTeachers/${subjectId}`);
      const teachers = r.data.teachers || [];
      const table = new DataTable({
        data: teachers,
        columns: [
          { field: "id", label: "#" },
          { field: "name", label: "Name" },
          { field: "email", label: "Email" },
          { field: "hire_date", label: "Hire Date" },
        ],
        actions: [],
        containerId: "subjectTeachersTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load teachers", "error");
    } finally {
      hideLoading();
    }
  }

  /* ─── CLASSES ─── */
  static async loadClasses() {
    const cw = document.getElementById("contentWrapper");
    const user = Auth.getUser();
    const isAdmin = user.role === "admin";
    cw.innerHTML = `<div class="section-header"><h2>Classes</h2>${isAdmin ? '<button class="btn btn-primary" id="createBtn">+ Create Class</button>' : ""}</div><div class="card"><div id="classesTable"></div></div>`;
    try {
      showLoading();
      const r = await API.get("/class");
      const classes = r.data.classes || [];
      const actions = isAdmin
        ? [
            {
              icon: "✏️",
              class: "btn-update",
              action: "update",
              label: "Update",
            },
            {
              icon: "🗑️",
              class: "btn-delete",
              action: "delete",
              label: "Delete",
            },
            {
              icon: "👨‍🎓",
              class: "btn-view",
              action: "viewStudents",
              label: "View Students",
            },
            {
              icon: "📋",
              class: "btn-view",
              action: "viewAttendance",
              label: "View Attendance",
            },
            {
              icon: "📚",
              class: "btn-view",
              action: "viewSubjects",
              label: "View Subjects",
            },
            {
              icon: "👨‍🏫",
              class: "btn-view",
              action: "viewTeachers",
              label: "View Teachers",
            },
            {
              icon: "📝",
              class: "btn-view",
              action: "viewClassSubjects",
              label: "Class Subjects",
            },
            {
              icon: "📊",
              class: "btn-view",
              action: "viewClassGrades",
              label: "View Grades",
            },
          ]
        : [];
      const table = new DataTable({
        data: classes,
        columns: [
          { field: "id", label: "#" },
          { field: "grade_level", label: "Grade" },
          { field: "group_name", label: "Group" },
          { field: "room_number", label: "Room" },
          { field: "academic_year", label: "Academic Year" },
          {
            field: "active",
            label: "Status",
            format: (v) => (v ? "Active" : "Inactive"),
          },
        ],
        actions,
        containerId: "classesTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.onAction = (action, id) =>
        this.handleAction(action, "class", id, classes);
      table.render();
      if (isAdmin)
        document
          .getElementById("createBtn")
          ?.addEventListener("click", () => Forms.showClassForm());
    } catch (e) {
      Toast.show("Failed to load classes", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadClassStudents(classId, classLabel) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Students in: ${classLabel}</h2><button class="btn btn-secondary" id="backBtn">← Back</button></div><div class="card"><div id="classStudentsTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadClasses());
    try {
      showLoading();
      const r = await API.get(`/class/getStudents/${classId}`);
      const students = r.data.students || [];
      const table = new DataTable({
        data: students,
        columns: [
          { field: "student_name", label: "#" },
          { field: "student_name", label: "Name" },
          { field: "student_email", label: "Email" },
          { field: "student_age", label: "Age" },
          { field: "student_gender", label: "Gender" },
        ],
        actions: [],
        containerId: "classStudentsTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load students", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadClassAttendance(classId, classLabel) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `
      <div class="section-header"><h2>Attendance for: ${classLabel}</h2><button class="btn btn-secondary" id="backBtn">← Back</button></div>
      <div class="card">
        <div class="form-row" style="align-items:flex-end;margin-bottom:16px">
          <div class="form-group" style="margin-bottom:0">
            <label>Select Date *</label>
            <input type="date" id="attendanceDayPicker" value="${new Date().toISOString().split("T")[0]}">
          </div>
          <button class="btn btn-primary" id="loadAttBtn">Load Attendance</button>
        </div>
        <div id="classAttendanceTable"></div>
      </div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadClasses());
    document.getElementById("loadAttBtn").addEventListener("click", () => {
      const day = document.getElementById("attendanceDayPicker").value;
      if (!day) {
        Toast.show("Please select a date", "error");
        return;
      }
      this._fetchClassAttendance(classId, day);
    });
    this._fetchClassAttendance(classId, new Date().toISOString().split("T")[0]);
  }

  static async _fetchClassAttendance(classId, day) {
    try {
      showLoading();
      const r = await API.post("/class/getAttendance", { classId, day });
      const attendance = r.data.attendance || [];
      const table = new DataTable({
        data: attendance,
        columns: [
          { field: "student_name", label: "#" },
          { field: "student_name", label: "Student" },
          {
            field: "attendance_status",
            label: "Status",
            format: (v) => {
              const sc =
                v === "present"
                  ? "status-present"
                  : v === "absent"
                    ? "status-absent"
                    : "status-late";
              return `<span class="${sc}">${v || "N/A"}</span>`;
            },
          },
        ],
        actions: [],
        containerId: "classAttendanceTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("No attendance found for this date", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadClassSubjects(classId, classLabel) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Subjects in: ${classLabel}</h2><button class="btn btn-secondary" id="backBtn">← Back</button></div><div class="card"><div id="classSubjectsTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadClasses());
    try {
      showLoading();
      const r = await API.get(`/class/getSubjects/${classId}`);
      const subjects = r.data.subjects || [];
      const table = new DataTable({
        data: subjects,
        columns: [
          { field: "subject_name", label: "#" },
          { field: "subject_name", label: "Subject Name" },
          { field: "subject_description", label: "Description" },
        ],
        actions: [],
        containerId: "classSubjectsTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load subjects", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadClassTeachers(classId, classLabel) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Teachers in: ${classLabel}</h2><button class="btn btn-secondary" id="backBtn">← Back</button></div><div class="card"><div id="classTeachersTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadClasses());
    try {
      showLoading();
      const r = await API.get(`/class/getTeachers/${classId}`);
      const teachers = r.data.teachers || [];
      const table = new DataTable({
        data: teachers,
        columns: [
          { field: "teacher_name", label: "#" },
          { field: "teacher_name", label: "Name" },
          { field: "subject_name", label: "Subject" },
        ],
        actions: [],
        containerId: "classTeachersTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load teachers", "error");
    } finally {
      hideLoading();
    }
  }

  /* ─── TEACHERS ─── */
  static async loadTeachers() {
    const cw = document.getElementById("contentWrapper");
    const user = Auth.getUser();
    const isAdmin = user.role === "admin";
    cw.innerHTML = `<div class="section-header"><h2>Teachers</h2>${isAdmin ? '<button class="btn btn-primary" id="createBtn">+ Create Teacher</button>' : ""}</div><div class="card"><div id="teachersTable"></div></div>`;
    try {
      showLoading();
      const r = await API.get("/teacher");
      const teachers = r.data.teachers || [];
      const actions = isAdmin
        ? [
            {
              icon: "✏️",
              class: "btn-update",
              action: "update",
              label: "Update",
            },
            {
              icon: "🗑️",
              class: "btn-delete",
              action: "delete",
              label: "Delete",
            },
            {
              icon: "🏫",
              class: "btn-view",
              action: "viewTeacherClasses",
              label: "Teacher Classes",
            },
          ]
        : [];
      const table = new DataTable({
        data: teachers,
        columns: [
          { field: "id", label: "#" },
          { field: "name", label: "Name" },
          { field: "email", label: "Email" },
          { field: "subject_name", label: "Subject" },
          { field: "hire_date", label: "Hire Date" },
        ],
        actions,
        containerId: "teachersTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.onAction = (action, id) =>
        this.handleAction(action, "teacher", id, teachers);
      table.render();
      if (isAdmin)
        document
          .getElementById("createBtn")
          ?.addEventListener("click", () => Forms.showTeacherForm());
    } catch (e) {
      Toast.show("Failed to load teachers", "error");
    } finally {
      hideLoading();
    }
  }

  /* ─── STUDENTS (ADMIN) ─── */
  static async loadStudents() {
    const cw = document.getElementById("contentWrapper");
    const user = Auth.getUser();
    const isAdmin = user.role === "admin";
    cw.innerHTML = `<div class="section-header"><h2>Students</h2><div style="display:flex;gap:8px">${isAdmin ? '<button class="btn btn-success" id="enrollBtn">Enroll Student</button><button class="btn btn-success" id="transferBtn">Transfer Student</button><button class="btn btn-primary" id="createBtn">+ Create Student</button>' : ""}</div></div><div class="card"><div id="studentsTable"></div></div>`;
    try {
      showLoading();
      const r = await API.get("/student");
      const students = r.data.students || [];
      const actions = isAdmin
        ? [
            {
              icon: "✏️",
              class: "btn-update",
              action: "update",
              label: "Update",
            },
            {
              icon: "🗑️",
              class: "btn-delete",
              action: "delete",
              label: "Delete",
            },
            {
              icon: "📊",
              class: "btn-view",
              action: "viewGrades",
              label: "View Grades",
            },
            {
              icon: "📋",
              class: "btn-view",
              action: "viewAttendance",
              label: "View Attendance",
            },
            // ── NEW: View Class button ──
            {
              icon: "🏫",
              class: "btn-view",
              action: "viewClass",
              label: "View Class",
            },
          ]
        : [];
      const table = new DataTable({
        data: students,
        columns: [
          { field: "id", label: "#" },
          { field: "name", label: "Name" },
          { field: "email", label: "Email" },
          { field: "age", label: "Age" },
          { field: "gender", label: "Gender" },
          { field: "phone", label: "Phone" },
        ],
        actions,
        containerId: "studentsTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.onAction = (action, id) =>
        this.handleAction(action, "student", id, students);
      table.render();
      if (isAdmin) {
        document
          .getElementById("createBtn")
          ?.addEventListener("click", () => Forms.showStudentForm());
        document
          .getElementById("enrollBtn")
          ?.addEventListener("click", () => Forms.showEnrollForm());
        document
          .getElementById("transferBtn")
          ?.addEventListener("click", () => Forms.showTransferForm());
      }
    } catch (e) {
      Toast.show("Failed to load students", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadStudentGradesAdmin(studentId, studentName) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Grades: ${studentName}</h2><button class="btn btn-secondary" id="backBtn">← Back</button></div><div class="card"><div id="studentGradesAdminTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadStudents());
    try {
      showLoading();
      const r = await API.post(`/student/getGrades/${studentId}`, {});
      const grades = r.data.grades || [];
      const table = new DataTable({
        data: grades,
        columns: [
          { field: "subject_name", label: "#" },
          { field: "subject_name", label: "Subject" },
          { field: "teacher_name", label: "Teacher" },
          { field: "grade_score", label: "Score" },
          { field: "subject_max_score", label: "Max Score" },
          {
            field: "grade_score",
            label: "Percentage",
            format: (v, c, row) => {
              const p = (
                (row.grade_score / row.subject_max_score) *
                100
              ).toFixed(1);
              const bc =
                p >= 90
                  ? "badge-success"
                  : p >= 75
                    ? "badge-info"
                    : p >= 60
                      ? "badge-warning"
                      : "badge-danger";
              return `<span class="badge ${bc}">${p}%</span>`;
            },
          },
        ],
        actions: [],
        containerId: "studentGradesAdminTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load grades", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadStudentAttendanceAdmin(studentId, studentName) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Attendance: ${studentName}</h2><button class="btn btn-secondary" id="backBtn">← Back</button></div><div class="card"><div id="studentAttendanceAdminTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadStudents());
    try {
      showLoading();
      const r = await API.post("/student/getAttendance", { studentId });
      const attendance = r.data.attendance || [];
      const table = new DataTable({
        data: attendance,
        columns: [
          { field: "attendancedate", label: "#" },
          { field: "attendancedate", label: "Date" },
          {
            field: "attendancestatus",
            label: "Status",
            format: (v) => {
              const sc =
                v === "present"
                  ? "status-present"
                  : v === "absent"
                    ? "status-absent"
                    : "status-late";
              return `<span class="${sc}">${v || "N/A"}</span>`;
            },
          },
          { field: "teachername", label: "Recorded By" },
        ],
        actions: [],
        containerId: "studentAttendanceAdminTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load attendance", "error");
    } finally {
      hideLoading();
    }
  }

  // ── NEW: Admin view of a specific student's class ──
  static async loadStudentClassAdmin(studentId, studentName) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Class of: ${studentName}</h2><button class="btn btn-secondary" id="backBtn">← Back</button></div><div class="card"><div id="studentClassAdminTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadStudents());
    try {
      showLoading();
      // GET /student/getClass  — admin: backend reads studentId from params, but route is /getClass (no :id)
      // Backend getStudentClass checks role: admin uses req.params.id, so we pass id in the path
      const r = await API.get(`/student/getClass/${studentId}`);
      const cls = r.data.class;
      const rows = cls ? [cls] : [];
      const table = new DataTable({
        data: rows,
        columns: [
          { field: "id", label: "#" },
          { field: "grade_level", label: "Grade" },
          { field: "group_name", label: "Group" },
          { field: "room_number", label: "Room" },
          { field: "academic_year", label: "Academic Year" },
          {
            field: "active",
            label: "Status",
            format: (v) => (v ? "Active" : "Inactive"),
          },
        ],
        actions: [],
        containerId: "studentClassAdminTable",
        searchable: false,
        sortable: false,
        paginated: false,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load student class", "error");
    } finally {
      hideLoading();
    }
  }

  /* ─── STUDENT (OWN) ─── */
  static async loadStudentGrades() {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>My Grades</h2></div><div class="card"><div id="gradesTable"></div></div>`;
    try {
      showLoading();
      const r = await API.post("/student/getGrades/0", {});
      const grades = r.data.grades || [];
      const table = new DataTable({
        data: grades,
        columns: [
          { field: "subject_name", label: "#" },
          { field: "subject_name", label: "Subject" },
          { field: "teacher_name", label: "Teacher" },
          { field: "grade_score", label: "Score" },
          { field: "subject_max_score", label: "Max Score" },
          {
            field: "grade_score",
            label: "Percentage",
            format: (v, c, row) => {
              const p = (
                (row.grade_score / row.subject_max_score) *
                100
              ).toFixed(1);
              const bc =
                p >= 90
                  ? "badge-success"
                  : p >= 75
                    ? "badge-info"
                    : p >= 60
                      ? "badge-warning"
                      : "badge-danger";
              return `<span class="badge ${bc}">${p}%</span>`;
            },
          },
        ],
        actions: [],
        containerId: "gradesTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load grades", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadStudentAttendance() {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>My Attendance</h2></div><div class="card"><div id="attendanceTable"></div></div>`;
    try {
      showLoading();
      const r = await API.get("/student/getAttendance");
      const attendance = r.data.attendance || [];
      const table = new DataTable({
        data: attendance,
        columns: [
          { field: "attendancedate", label: "#" },
          { field: "attendancedate", label: "Date" },
          {
            field: "attendancestatus",
            label: "Status",
            format: (v) => {
              const sc =
                v === "present"
                  ? "status-present"
                  : v === "absent"
                    ? "status-absent"
                    : "status-late";
              return `<span class="${sc}">${v || "N/A"}</span>`;
            },
          },
          { field: "teachername", label: "Recorded By" },
        ],
        actions: [],
        containerId: "attendanceTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load attendance", "error");
    } finally {
      hideLoading();
    }
  }

  // ── NEW: Student own — My Classes via GET /student/getClass ──
  static async loadStudentClasses() {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>My Class</h2></div><div class="card"><div id="myClassTable"></div></div>`;
    try {
      showLoading();
      // GET /student/getClass — student role: backend resolves studentId from token
      const r = await API.get("/student/getClass");
      const cls = r.data.class;
      const rows = cls ? [cls] : [];
      const table = new DataTable({
        data: rows,
        columns: [
          { field: "id", label: "#" },
          { field: "grade_level", label: "Grade" },
          { field: "group_name", label: "Group" },
          { field: "room_number", label: "Room" },
          { field: "academic_year", label: "Academic Year" },
          {
            field: "active",
            label: "Status",
            format: (v) => (v ? "Active" : "Inactive"),
          },
        ],
        actions: [],
        containerId: "myClassTable",
        searchable: false,
        sortable: false,
        paginated: false,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load your class", "error");
    } finally {
      hideLoading();
    }
  }

  // ── NEW: Student own — My Subjects via GET /student/getSubjects ──
  static async loadStudentSubjects() {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>My Subjects</h2></div><div class="card"><div id="mySubjectsTable"></div></div>`;
    try {
      showLoading();
      // GET /student/getSubjects — student role: backend resolves studentId from token
      // Backend returns: { subjects: [{ subject_name }] }
      const r = await API.get("/student/getSubjects");
      const subjects = Array.isArray(r.data.subjects)
        ? r.data.subjects
        : r.data.subjects
          ? [r.data.subjects]
          : [];
      const table = new DataTable({
        data: subjects,
        columns: [
          { field: "subject_name", label: "#" },
          { field: "subject_name", label: "Subject Name" },
        ],
        actions: [],
        containerId: "mySubjectsTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load your subjects", "error");
    } finally {
      hideLoading();
    }
  }

  /* ─── TEACHER CLASSES ─── */
  static async loadTeacherClasses() {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>My Classes</h2></div><div id="teacherClassesContainer"></div>`;
    try {
      showLoading();
      const r = await API.get("/teacher/teacherClasses");
      const classes = r.data.classes || [];
      if (!classes.length) {
        document.getElementById("teacherClassesContainer").innerHTML =
          '<div class="card"><p style="color:var(--text-secondary);text-align:center;padding:32px">No classes assigned.</p></div>';
        return;
      }
      const container = document.getElementById("teacherClassesContainer");
      classes.forEach((cls, idx) => {
        const classLabel = `${cls.grade_level} - ${cls.group_name}`;
        const card = document.createElement("div");
        card.className = "card teacher-class-card";
        card.innerHTML = `
          <div class="teacher-class-header">
            <div>
              <span class="teacher-class-index">${idx + 1}</span>
              <strong>${classLabel}</strong>
              <span class="badge badge-info" style="margin-left:8px">Room ${cls.room_number || "N/A"}</span>
            </div>
            <div class="teacher-class-actions">
              <button class="btn btn-secondary btn-sm" data-action="viewStudents" data-id="${cls.id}" data-label="${classLabel}">👨‍🎓 Students</button>
              <button class="btn btn-secondary btn-sm" data-action="viewGrades" data-id="${cls.id}" data-label="${classLabel}">📊 Grades</button>
              <button class="btn btn-secondary btn-sm" data-action="viewAttendance" data-id="${cls.id}" data-label="${classLabel}">📋 Attendance</button>
              <button class="btn btn-primary btn-sm" data-action="addGrade" data-id="${cls.id}" data-label="${classLabel}">+ Add Grade</button>
              <button class="btn btn-primary btn-sm" data-action="addAttendance" data-id="${cls.id}" data-label="${classLabel}">+ Add Attendance</button>
            </div>
          </div>`;
        card.querySelectorAll("button[data-action]").forEach((btn) => {
          btn.addEventListener("click", () => {
            this.handleTeacherClassAction(
              btn.dataset.action,
              btn.dataset.id,
              btn.dataset.label,
            );
          });
        });
        container.appendChild(card);
      });
    } catch (e) {
      Toast.show("Failed to load classes", "error");
    } finally {
      hideLoading();
    }
  }

  static async handleTeacherClassAction(action, classId, classLabel) {
    if (action === "viewStudents")
      await this.loadTeacherClassStudents(classId, classLabel);
    else if (action === "viewGrades")
      await this.loadTeacherClassGrades(classId, classLabel);
    else if (action === "viewAttendance")
      await this.loadTeacherClassAttendance(classId, classLabel);
    else if (action === "addGrade")
      Forms.showGradeForm(null, classId, null, () => this.loadTeacherClasses());
    else if (action === "addAttendance")
      Forms.showAttendanceForm(null, classId, null, () =>
        this.loadTeacherClasses(),
      );
  }

  static async loadTeacherClassStudents(classId, classLabel) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Students in: ${classLabel}</h2><button class="btn btn-secondary" id="backBtn">← Back to My Classes</button></div><div class="card"><div id="tcStudentsTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadTeacherClasses());
    try {
      showLoading();
      const r = await API.get(`/class/getStudents/${classId}`);
      const students = r.data.students || [];
      const table = new DataTable({
        data: students,
        columns: [
          { field: "student_name", label: "#" },
          { field: "student_name", label: "Name" },
          { field: "student_email", label: "Email" },
          { field: "student_age", label: "Age" },
          { field: "student_gender", label: "Gender" },
        ],
        actions: [],
        containerId: "tcStudentsTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load students", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadTeacherClassGrades(classId, classLabel) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="section-header"><h2>Grades: ${classLabel}</h2><div style="display:flex;gap:8px"><button class="btn btn-primary" id="addGradeBtn">+ Add Grade</button><button class="btn btn-secondary" id="backBtn">← Back</button></div></div><div class="card"><div id="tcGradesTable"></div></div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadTeacherClasses());
    document.getElementById("addGradeBtn").addEventListener("click", () => {
      Forms.showGradeForm(null, classId, null, () =>
        this.loadTeacherClassGrades(classId, classLabel),
      );
    });
    try {
      showLoading();
      const r = await API.post("/teacher/gradesClass", { classId });
      const grades = r.data.grades || [];
      const table = new DataTable({
        data: grades,
        columns: [
          { field: "student_name", label: "#" },
          { field: "student_name", label: "Student" },
          { field: "subject_name", label: "Subject" },
          { field: "score", label: "Score" },
          { field: "max_score", label: "Max" },
          {
            field: "score",
            label: "%",
            format: (v, c, row) => {
              const p =
                row.max_score > 0
                  ? ((row.score / row.max_score) * 100).toFixed(1)
                  : "0.0";
              const bc =
                p >= 90
                  ? "badge-success"
                  : p >= 75
                    ? "badge-info"
                    : p >= 60
                      ? "badge-warning"
                      : "badge-danger";
              return `<span class="badge ${bc}">${p}%</span>`;
            },
          },
        ],
        actions: [
          {
            icon: "✏️",
            class: "btn-update",
            action: "update",
            label: "Update Grade",
          },
          {
            icon: "🗑️",
            class: "btn-delete",
            action: "delete",
            label: "Delete Grade",
          },
        ],
        containerId: "tcGradesTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.onAction = (action, id) => {
        const item = grades.find((g) => String(g.id) === String(id));
        if (action === "update") {
          Forms.showGradeForm(item, classId, null, () =>
            this.loadTeacherClassGrades(classId, classLabel),
          );
        } else if (action === "delete") {
          Modal.confirm(
            "Delete Grade",
            "Are you sure you want to delete this grade?",
            async () => {
              try {
                showLoading();
                await API.del(`/teacher/deleteGrade/${id}`);
                Toast.show("Grade deleted", "success");
                this.loadTeacherClassGrades(classId, classLabel);
              } catch (e) {
                Toast.show("Delete failed", "error");
              } finally {
                hideLoading();
              }
            },
          );
        }
      };
      table.render();
    } catch (e) {
      Toast.show("Failed to load grades", "error");
    } finally {
      hideLoading();
    }
  }

  static async loadTeacherClassAttendance(classId, classLabel) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `
      <div class="section-header"><h2>Attendance: ${classLabel}</h2><div style="display:flex;gap:8px"><button class="btn btn-primary" id="addAttBtn">+ Add Attendance</button><button class="btn btn-secondary" id="backBtn">← Back</button></div></div>
      <div class="card">
        <div class="form-row" style="align-items:flex-end;margin-bottom:16px">
          <div class="form-group" style="margin-bottom:0">
            <label>Select Date *</label>
            <input type="date" id="tcAttDayPicker" value="${new Date().toISOString().split("T")[0]}">
          </div>
          <button class="btn btn-primary" id="loadTcAttBtn">Load</button>
        </div>
        <div id="tcAttendanceTable"></div>
      </div>`;
    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadTeacherClasses());
    document.getElementById("addAttBtn").addEventListener("click", () => {
      Forms.showAttendanceForm(null, classId, null, () =>
        this.loadTeacherClassAttendance(classId, classLabel),
      );
    });
    document.getElementById("loadTcAttBtn").addEventListener("click", () => {
      const day = document.getElementById("tcAttDayPicker").value;
      if (!day) {
        Toast.show("Please select a date", "error");
        return;
      }
      this._fetchTeacherClassAttendance(classId, classLabel, day);
    });
    this._fetchTeacherClassAttendance(
      classId,
      classLabel,
      new Date().toISOString().split("T")[0],
    );
  }

  static async _fetchTeacherClassAttendance(classId, classLabel, day) {
    try {
      showLoading();
      const r = await API.post("/class/getAttendance", { classId, day });
      const attendance = r.data.attendance || [];
      const table = new DataTable({
        data: attendance,
        columns: [
          { field: "student_name", label: "#" },
          { field: "student_name", label: "Student" },
          {
            field: "attendance_status",
            label: "Status",
            format: (v) => {
              const sc =
                v === "present"
                  ? "status-present"
                  : v === "absent"
                    ? "status-absent"
                    : "status-late";
              return `<span class="${sc}">${v || "N/A"}</span>`;
            },
          },
        ],
        actions: [
          {
            icon: "✏️",
            class: "btn-update",
            action: "update",
            label: "Update Attendance",
          },
          {
            icon: "🗑️",
            class: "btn-delete",
            action: "delete",
            label: "Delete Attendance",
          },
        ],
        containerId: "tcAttendanceTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.onAction = (action, id) => {
        const item = attendance.find((a) => String(a.id) === String(id));
        if (action === "update") {
          Forms.showAttendanceForm(item, classId, null, () =>
            this._fetchTeacherClassAttendance(classId, classLabel, day),
          );
        } else if (action === "delete") {
          Modal.confirm(
            "Delete Attendance",
            "Are you sure you want to delete this record?",
            async () => {
              try {
                showLoading();
                await API.del(`/teacher/deleteAttendance/${id}`);
                Toast.show("Record deleted", "success");
                this._fetchTeacherClassAttendance(classId, classLabel, day);
              } catch (e) {
                Toast.show("Delete failed", "error");
              } finally {
                hideLoading();
              }
            },
          );
        }
      };
      table.render();
    } catch (e) {
      Toast.show("No attendance found for this date", "error");
    } finally {
      hideLoading();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADD THESE METHODS TO YOUR sections.js FILE (AppSections class)
  // Insert before the closing braces of the class
  // ═══════════════════════════════════════════════════════════════════════════════

  /* ─── CLASS SUBJECTS (ADMIN) ─── */
  static async loadClassSubjects_Admin(classId, classLabel) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `
      <div class="section-header">
        <h2>Class Subjects: ${classLabel}</h2>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" id="createClassSubjectBtn">+ Add Subject to Class</button>
          <button class="btn btn-secondary" id="backBtn">← Back</button>
        </div>
      </div>
      <div class="card"><div id="classSubjectsAdminTable"></div></div>`;

    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadClasses());
    document
      .getElementById("createClassSubjectBtn")
      .addEventListener("click", () => {
        Forms.showClassSubjectForm(null, classId, () =>
          this.loadClassSubjects_Admin(classId, classLabel),
        );
      });

    try {
      showLoading();
      const r = await API.get(`/classSubjects/${classId}`);
      const classSubjects = r.data.classSubjects || [];

      const table = new DataTable({
        data: classSubjects,
        columns: [
          { field: "id", label: "#" },
          { field: "subject_name", label: "Subject" },
          { field: "teacher_name", label: "Teacher" },
          { field: "weekly_hours", label: "Weekly Hours" },
        ],
        actions: [
          {
            icon: "✏️",
            class: "btn-update",
            action: "update",
            label: "Update",
          },
          {
            icon: "🗑️",
            class: "btn-delete",
            action: "delete",
            label: "Remove Teacher",
          },
        ],
        containerId: "classSubjectsAdminTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });

      table.onAction = (action, id) => {
        const item = classSubjects.find((cs) => String(cs.id) === String(id));
        if (action === "update") {
          Forms.showClassSubjectForm(item, classId, () =>
            this.loadClassSubjects_Admin(classId, classLabel),
          );
        } else if (action === "delete") {
          Modal.confirm(
            "Remove Teacher",
            "Are you sure you want to remove this teacher from the class?",
            async () => {
              try {
                showLoading();
                await API.del("/classSubjects/deleteTeacher", {
                  teacherId: item.teacher_id,
                  classId: classId,
                });
                Toast.show("Teacher removed from class", "success");
                this.loadClassSubjects_Admin(classId, classLabel);
              } catch (e) {
                Toast.show("Failed to remove teacher", "error");
              } finally {
                hideLoading();
              }
            },
          );
        }
      };
      table.render();
    } catch (e) {
      Toast.show("Failed to load class subjects", "error");
    } finally {
      hideLoading();
    }
  }

  /* ─── CLASS GRADES BY SUBJECT (ADMIN) ─── */
  static async loadClassGradesAdmin(classId, classLabel) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `
      <div class="section-header">
        <h2>Grades: ${classLabel}</h2>
        <button class="btn btn-secondary" id="backBtn">← Back</button>
      </div>
      <div class="card">
        <div class="form-row" style="align-items:flex-end;margin-bottom:16px">
          <div class="form-group" style="margin-bottom:0;flex:1">
            <label>Select Subject *</label>
            <select id="subjectSelect" style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:4px">
              <option value="">Loading subjects...</option>
            </select>
          </div>
          <button class="btn btn-primary" id="loadGradesBtn">Load Grades</button>
        </div>
        <div id="classGradesTable"></div>
      </div>`;

    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadClasses());

    try {
      showLoading();
      const r = await API.get(`/class/getSubjects/${classId}`);
      const classSubjects = r.data.subjects || [];

      const subjectSelect = document.getElementById("subjectSelect");
      if (classSubjects.length === 0) {
        subjectSelect.innerHTML = '<option value="">No subjects found</option>';
      } else {
        subjectSelect.innerHTML =
          '<option value="">Select a subject</option>' +
          classSubjects
            .map(
              (cs) =>
                `<option value="${cs.subject_id}">${cs.subject_name}</option>`,
            )
            .join("");
      }

      document
        .getElementById("loadGradesBtn")
        .addEventListener("click", async () => {
          const subjectId = subjectSelect.value;
          if (!subjectId) {
            Toast.show("Please select a subject", "error");
            return;
          }
          await this._fetchClassGrades(classId, subjectId);
        });
    } catch (e) {
      Toast.show("Failed to load subjects", "error");
    } finally {
      hideLoading();
    }
  }

  static async _fetchClassGrades(classId, subjectId) {
    try {
      showLoading();
      const r = await API.post("/teacher/gradesClass", { classId, subjectId });
      const grades = r.data.grades || [];

      const table = new DataTable({
        data: grades,
        columns: [
          { field: "student_name", label: "#" },
          { field: "student_name", label: "Student" },
          { field: "subject_name", label: "Subject" },
          { field: "score", label: "Score" },
          { field: "max_score", label: "Max Score" },
          {
            field: "score",
            label: "%",
            format: (v, c, row) => {
              const p =
                row.max_score > 0
                  ? ((row.score / row.max_score) * 100).toFixed(1)
                  : "0.0";
              const bc =
                p >= 90
                  ? "badge-success"
                  : p >= 75
                    ? "badge-info"
                    : p >= 60
                      ? "badge-warning"
                      : "badge-danger";
              return `<span class="badge ${bc}">${p}%</span>`;
            },
          },
          { field: "teacher_name", label: "Teacher" },
        ],
        actions: [],
        containerId: "classGradesTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });
      table.render();
    } catch (e) {
      Toast.show("Failed to load grades", "error");
    } finally {
      hideLoading();
    }
  }

  /* ─── TEACHER CLASSES (ADMIN) ─── */
  static async loadTeacherClassesAdmin(teacherId, teacherName) {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `
      <div class="section-header">
        <h2>Classes: ${teacherName}</h2>
        <button class="btn btn-secondary" id="backBtn">← Back</button>
      </div>
      <div class="card"><div id="teacherClassesAdminTable"></div></div>`;

    document
      .getElementById("backBtn")
      .addEventListener("click", () => this.loadTeachers());

    try {
      showLoading();
      const r = await API.post("/teacher/teacherClasses", { teacherId });
      const classes = r.data.classes || [];

      const table = new DataTable({
        data: classes,
        columns: [
          { field: "id", label: "#" },
          { field: "grade_level", label: "Grade" },
          { field: "group_name", label: "Group" },
          { field: "room_number", label: "Room" },
          { field: "academic_year", label: "Academic Year" },
        ],
        actions: [
          {
            icon: "🗑️",
            class: "btn-delete",
            action: "removeFromClass",
            label: "Remove From Class",
          },
        ],
        containerId: "teacherClassesAdminTable",
        searchable: true,
        sortable: true,
        paginated: true,
      });

      table.onAction = (action, classId) => {
        if (action === "removeFromClass") {
          Modal.confirm(
            "Remove Teacher",
            "Are you sure you want to remove this teacher from the class?",
            async () => {
              try {
                showLoading();
                await API.del("/classSubjects/deleteTeacher", {
                  teacherId,
                  classId,
                });
                Toast.show("Teacher removed from class", "success");
                this.loadTeacherClassesAdmin(teacherId, teacherName);
              } catch (e) {
                Toast.show("Failed to remove teacher", "error");
              } finally {
                hideLoading();
              }
            },
          );
        }
      };
      table.render();
    } catch (e) {
      Toast.show("Failed to load teacher classes", "error");
    } finally {
      hideLoading();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MODIFICATIONS TO EXISTING METHODS IN sections.js
  // ═══════════════════════════════════════════════════════════════════════════════

  // 1. In loadClasses() method, REPLACE the actions array with:
  /*
      const actions = isAdmin
        ? [
            { icon: "✏️", class: "btn-update", action: "update", label: "Update" },
            { icon: "🗑️", class: "btn-delete", action: "delete", label: "Delete" },
            { icon: "👨‍🎓", class: "btn-view", action: "viewStudents", label: "View Students" },
            { icon: "📋", class: "btn-view", action: "viewAttendance", label: "View Attendance" },
            { icon: "📚", class: "btn-view", action: "viewSubjects", label: "View Subjects" },
            { icon: "👨‍🏫", class: "btn-view", action: "viewTeachers", label: "View Teachers" },
            { icon: "📝", class: "btn-view", action: "viewClassSubjects", label: "Class Subjects" },
            { icon: "📊", class: "btn-view", action: "viewClassGrades", label: "View Grades" },
          ]
        : [];
*/

  // 2. In loadTeachers() method, REPLACE the actions array with:
  /*
      const actions = isAdmin
        ? [
            { icon: "✏️", class: "btn-update", action: "update", label: "Update" },
            { icon: "🗑️", class: "btn-delete", action: "delete", label: "Delete" },
            { icon: "🏫", class: "btn-view", action: "viewTeacherClasses", label: "Teacher Classes" },
          ]
        : [];
*/

  // 3. In handleAction() method, ADD these new branches before the closing brace:
  /*
    } else if (action === "viewClassSubjects" && type === "class") {
      this.loadClassSubjects_Admin(id, `${item?.grade_level} - ${item?.group_name}`);
    } else if (action === "viewClassGrades" && type === "class") {
      this.loadClassGradesAdmin(id, `${item?.grade_level} - ${item?.group_name}`);
    } else if (action === "viewTeacherClasses" && type === "teacher") {
      this.loadTeacherClassesAdmin(id, item?.name || "");
*/

  /* ─── CENTRAL ACTION ROUTER ─── */
  static handleAction(action, type, id, data) {
    const item = data.find((i) => String(i.id) === String(id));

    if (action === "update") {
      if (type === "subject") Forms.showSubjectForm(item);
      else if (type === "class") Forms.showClassForm(item);
      else if (type === "teacher") Forms.showTeacherForm(item);
      else if (type === "student") Forms.showStudentForm(item);
    } else if (action === "delete") {
      Modal.confirm(
        "Confirm Delete",
        `Are you sure you want to delete this ${type}?`,
        async () => {
          try {
            showLoading();
            await API.del(`/${type}/${id}`);
            Toast.show("Deleted successfully", "success");
            if (type === "subject") this.loadSubjects();
            else if (type === "class") this.loadClasses();
            else if (type === "teacher") this.loadTeachers();
            else if (type === "student") this.loadStudents();
          } catch (e) {
            Toast.show("Delete failed", "error");
          } finally {
            hideLoading();
          }
        },
      );
    } else if (action === "viewClasses" && type === "subject") {
      this.loadSubjectClasses(id, item?.name || "");
    } else if (action === "viewTeachers" && type === "subject") {
      this.loadSubjectTeachers(id, item?.name || "");
    } else if (action === "viewStudents" && type === "class") {
      this.loadClassStudents(id, `${item?.grade_level} - ${item?.group_name}`);
    } else if (action === "viewAttendance" && type === "class") {
      this.loadClassAttendance(
        id,
        `${item?.grade_level} - ${item?.group_name}`,
      );
    } else if (action === "viewSubjects" && type === "class") {
      this.loadClassSubjects(id, `${item?.grade_level} - ${item?.group_name}`);
    } else if (action === "viewTeachers" && type === "class") {
      this.loadClassTeachers(id, `${item?.grade_level} - ${item?.group_name}`);
    } else if (action === "viewGrades" && type === "student") {
      this.loadStudentGradesAdmin(id, item?.name || "");
    } else if (action === "viewAttendance" && type === "student") {
      this.loadStudentAttendanceAdmin(id, item?.name || "");
      // ── NEW: route viewClass action for student ──
    } else if (action === "viewClass" && type === "student") {
      this.loadStudentClassAdmin(id, item?.name || "");
    } else if (action === "viewClassSubjects" && type === "class") {
      this.loadClassSubjects_Admin(
        id,
        `${item?.grade_level} - ${item?.group_name}`,
      );
    } else if (action === "viewClassGrades" && type === "class") {
      this.loadClassGradesAdmin(
        id,
        `${item?.grade_level} - ${item?.group_name}`,
      );
    } else if (action === "viewTeacherClasses" && type === "teacher") {
      this.loadTeacherClassesAdmin(id, item?.name || "");
    }
  }
}
if (typeof window !== "undefined") window.AppSections = AppSections;
