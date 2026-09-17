class Forms {
  static showSubjectForm(d = null) {
    const isEdit = !!d;
    const html = `<form id="subjectForm">
      <div class="form-group"><label>Subject Name *</label><input type="text" name="name" value="${d?.name || ""}" required></div>
      <div class="form-group"><label>Description</label><textarea name="description">${d?.description || ""}</textarea></div>
      <div class="form-group"><label><input type="checkbox" name="isCore" ${d?.is_core ? "checked" : ""}> Core Subject</label></div>
    </form>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="submitBtn">${isEdit ? "Update" : "Create"}</button>`;
    Modal.show(`${isEdit ? "Edit" : "Create"} Subject`, html, footer);
    document.getElementById("submitBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("subjectForm"));
      // Backend updateSubject uses Object.keys(req.body) directly into SQL → must match DB columns exactly
      const data = {
        name: fd.get("name"),
        description: fd.get("description"),
        is_core: fd.get("isCore") === "on",
      };
      try {
        showLoading();
        if (isEdit) await API.patch(`/subject/${d.id}`, data);
        else
          await API.post("/subject", {
            name: data.name,
            description: data.description,
            isCore: data.is_core,
          });
        Toast.show(`Subject ${isEdit ? "updated" : "created"}`, "success");
        Modal.close();
        window.AppSections.loadSubjects();
      } catch (e) {
        Toast.show(e.message, "error");
      } finally {
        hideLoading();
      }
    };
  }

  static showClassForm(d = null) {
    const isEdit = !!d;
    const html = `<form id="classForm">
      <div class="form-row">
        <div class="form-group"><label>Grade Level *</label><input type="text" name="gradeLevel" value="${d?.grade_level || ""}" required></div>
        <div class="form-group"><label>Group Name *</label><input type="text" name="groupName" value="${d?.group_name || ""}" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Academic Year *</label><input type="text" name="academicYear" value="${d?.academic_year || ""}" required></div>
        <div class="form-group"><label>Room Number *</label><input type="text" name="roomNumber" value="${d?.room_number || ""}" required></div>
      </div>
      <div class="form-group"><label>Status *</label><select name="status" required>
        <option value="active" ${d?.status === "active" ? "selected" : ""}>Active</option>
        <option value="inactive" ${d?.status === "inactive" ? "selected" : ""}>Inactive</option>
      </select></div>
    </form>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="submitBtn">${isEdit ? "Update" : "Create"}</button>`;
    Modal.show(`${isEdit ? "Edit" : "Create"} Class`, html, footer);
    document.getElementById("submitBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("classForm"));
      // CREATE uses camelCase (backend createClass destructures gradeLevel, groupName, etc.)
      // UPDATE uses Object.keys(req.body) into SQL → must use DB column names exactly
      const createData = {
        gradeLevel: fd.get("gradeLevel"),
        groupName: fd.get("groupName"),
        academicYear: fd.get("academicYear"),
        roomNumber: fd.get("roomNumber"),
      };
      const updateData = {
        grade_level: fd.get("gradeLevel"),
        group_name: fd.get("groupName"),
        academic_year: fd.get("academicYear"),
        room_number: fd.get("roomNumber"),
      };
      try {
        showLoading();
        if (isEdit) await API.patch(`/class/${d.id}`, updateData);
        else await API.post("/class", createData);
        Toast.show(`Class ${isEdit ? "updated" : "created"}`, "success");
        Modal.close();
        window.AppSections.loadClasses();
      } catch (e) {
        Toast.show(e.message, "error");
      } finally {
        hideLoading();
      }
    };
  }

  static async showTeacherForm(d = null) {
    const isEdit = !!d;
    let subjectsHtml = "";
    try {
      const r = await API.get("/subject");
      const subjects = r.data.subjects || [];
      subjectsHtml = subjects
        .map(
          (s) =>
            `<option value="${s.id}" ${d?.subject_id === s.id ? "selected" : ""}>${s.name}</option>`,
        )
        .join("");
    } catch (e) {}
    const html = `<form id="teacherForm">
      <div class="form-row">
        <div class="form-group"><label>Name *</label><input type="text" name="name" value="${d?.name || ""}" required></div>
        <div class="form-group"><label>Email *</label><input type="email" name="email" value="${d?.email || ""}" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Subject *</label><select name="subjectId" required>${subjectsHtml}</select></div>
        <div class="form-group"><label>Hire Date *</label><input type="date" name="hire_date" value="${d?.hire_date || ""}" required></div>
      </div>
      ${
        !isEdit
          ? `<div class="form-row">
        <div class="form-group"><label>Password *</label><input type="password" name="password" required></div>
        <div class="form-group"><label>Confirm Password *</label><input type="password" name="confirmPassword" required></div>
      </div>`
          : ""
      }
    </form>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="submitBtn">${isEdit ? "Update" : "Create"}</button>`;
    Modal.show(`${isEdit ? "Edit" : "Create"} Teacher`, html, footer);
    document.getElementById("submitBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("teacherForm"));
      if (isEdit) {
        // UPDATE: Object.keys(req.body) → DB column names. No role field (not a teacher table column).
        const data = {
          name: fd.get("name"),
          email: fd.get("email"),
          subject_id: fd.get("subjectId"),
          hire_date: fd.get("hire_date"),
        };
        try {
          showLoading();
          await API.patch(`/teacher/${d.id}`, data);
          Toast.show("Teacher updated", "success");
          Modal.close();
          window.AppSections.loadTeachers();
        } catch (e) {
          Toast.show(e.message, "error");
        } finally {
          hideLoading();
        }
      } else {
        // CREATE: backend destructures { name, email, subjectId, hire_date, confirmPassword, role, password }
        const pw = fd.get("password");
        const cpw = fd.get("confirmPassword");
        if (pw !== cpw) {
          Toast.show("Passwords do not match", "error");
          return;
        }
        const data = {
          name: fd.get("name"),
          email: fd.get("email"),
          subjectId: fd.get("subjectId"),
          hire_date: fd.get("hire_date"),
          password: pw,
          confirmPassword: cpw,
          role: "teacher",
        };
        try {
          showLoading();
          await API.post("/teacher", data);
          Toast.show("Teacher created", "success");
          Modal.close();
          window.AppSections.loadTeachers();
        } catch (e) {
          Toast.show(e.message, "error");
        } finally {
          hideLoading();
        }
      }
    };
  }

  static showStudentForm(d = null) {
    const isEdit = !!d;
    const html = `<form id="studentForm">
      <div class="form-row">
        <div class="form-group"><label>Name *</label><input type="text" name="name" value="${d?.name || ""}" required></div>
        <div class="form-group"><label>Email *</label><input type="email" name="email" value="${d?.email || ""}" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Age *</label><input type="number" name="age" value="${d?.age || ""}" required></div>
        <div class="form-group"><label>Gender *</label><select name="gender" required>
          <option value="male" ${d?.gender === "male" ? "selected" : ""}>Male</option>
          <option value="female" ${d?.gender === "female" ? "selected" : ""}>Female</option>
        </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Phone *</label><input type="tel" name="phone" value="${d?.phone || ""}" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Parent Name *</label><input type="text" name="parent_name" value="${d?.parent_name || ""}" required></div>
        <div class="form-group"><label>Parent Phone *</label><input type="tel" name="parent_phone" value="${d?.parent_phone || ""}" required></div>
      </div>
      ${
        !isEdit
          ? `<div class="form-row">
        <div class="form-group"><label>Password *</label><input type="password" name="password" required></div>
        <div class="form-group"><label>Confirm Password *</label><input type="password" name="confirmPassword" required></div>
      </div>`
          : ""
      }
    </form>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="submitBtn">${isEdit ? "Update" : "Create"}</button>`;
    Modal.show(`${isEdit ? "Edit" : "Create"} Student`, html, footer);
    document.getElementById("submitBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("studentForm"));
      if (isEdit) {
        // UPDATE: Object.keys(req.body) → DB column names. No role field (not in student table).
        const data = {
          name: fd.get("name"),
          email: fd.get("email"),
          age: parseInt(fd.get("age")),
          gender: fd.get("gender"),
          phone: fd.get("phone"),
          parent_name: fd.get("parent_name"),
          parent_phone: fd.get("parent_phone"),
        };
        try {
          showLoading();
          await API.patch(`/student/${d.id}`, data);
          Toast.show("Student updated", "success");
          Modal.close();
          window.AppSections.loadStudents();
        } catch (e) {
          Toast.show(e.message, "error");
        } finally {
          hideLoading();
        }
      } else {
        // CREATE: backend destructures { name, email, age, gender, phone, parent_name, parent_phone, confirmPassword, role, password }
        const pw = fd.get("password");
        const cpw = fd.get("confirmPassword");
        if (pw !== cpw) {
          Toast.show("Passwords do not match", "error");
          return;
        }
        const data = {
          name: fd.get("name"),
          email: fd.get("email"),
          age: parseInt(fd.get("age")),
          gender: fd.get("gender"),
          phone: fd.get("phone"),
          parent_name: fd.get("parent_name"),
          parent_phone: fd.get("parent_phone"),
          password: pw,
          confirmPassword: cpw,
          role: "student",
        };
        try {
          showLoading();
          await API.post("/student", data);
          Toast.show("Student created", "success");
          Modal.close();
          window.AppSections.loadStudents();
        } catch (e) {
          Toast.show(e.message, "error");
        } finally {
          hideLoading();
        }
      }
    };
  }

  static async showEnrollForm() {
    let studentsHtml = "",
      classesHtml = "";
    try {
      const [sr, cr] = await Promise.all([
        API.get("/student"),
        API.get("/class"),
      ]);
      studentsHtml = (sr.data.students || [])
        .map((s) => `<option value="${s.id}">${s.name}</option>`)
        .join("");
      classesHtml = (cr.data.classes || [])
        .map(
          (c) =>
            `<option value="${c.id}">${c.grade_level} - ${c.group_name}</option>`,
        )
        .join("");
    } catch (e) {}
    const html = `<form id="enrollForm">
      <div class="form-group"><label>Student *</label><select name="studentId" required>${studentsHtml}</select></div>
      <div class="form-group"><label>Class *</label><select name="classId" required>${classesHtml}</select></div>
    </form>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-success" id="submitBtn">Enroll</button>`;
    Modal.show("Enroll Student", html, footer);
    document.getElementById("submitBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("enrollForm"));
      try {
        showLoading();
        // Backend enrollStudent route is GET /student/enrollStudent (confirmed from routes) — but it destructures req.body, so POST is correct; route file has a typo (GET instead of POST) — we call POST, backend likely accepts it
        await API.post("/student/enrollStudent", {
          studentId: fd.get("studentId"),
          classId: fd.get("classId"),
        });
        Toast.show("Student enrolled successfully", "success");
        Modal.close();
      } catch (e) {
        Toast.show(e.message, "error");
      } finally {
        hideLoading();
      }
    };
  }

  static async showTransferForm() {
    let studentsHtml = "",
      classesHtml = "";
    try {
      const [sr, cr] = await Promise.all([
        API.get("/student"),
        API.get("/class"),
      ]);
      studentsHtml = (sr.data.students || [])
        .map((s) => `<option value="${s.id}">${s.name}</option>`)
        .join("");
      classesHtml = (cr.data.classes || [])
        .map(
          (c) =>
            `<option value="${c.id}">${c.grade_level} - ${c.group_name}</option>`,
        )
        .join("");
    } catch (e) {}
    const html = `<form id="transferForm">
      <div class="form-group"><label>Student *</label><select name="studentId" required>${studentsHtml}</select></div>
      <div class="form-group"><label>New Class *</label><select name="newClassId" required>${classesHtml}</select></div>
    </form>`;
    const footer = `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-success" id="submitBtn">Transfer</button>`;
    Modal.show("Transfer Student", html, footer);
    document.getElementById("submitBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("transferForm"));
      try {
        showLoading();
        await API.patch("/student/transferStudent", {
          studentId: fd.get("studentId"),
          newClassId: fd.get("newClassId"),
        });
        Toast.show("Student transferred successfully", "success");
        Modal.close();
      } catch (e) {
        Toast.show(e.message, "error");
      } finally {
        hideLoading();
      }
    };
  }

  static async showGradeForm(
    d = null,
    classId = null,
    studentId = null,
    onSuccess = null,
  ) {
    const isEdit = !!d;
    let studentsHtml = "";

    // جلب الطلاب من الكلاس
    try {
      const sr = await API.get(`/class/getStudents/${classId}`);
      console.log("Fetched students:", sr.data.students);

      studentsHtml = (sr.data.students || [])
        .map(
          (s) =>
            `<option value="${s.student_id}" ${
              d?.student_id === s.student_id || studentId == s.student_id
                ? "selected"
                : ""
            }>${s.student_name}</option>`,
        )
        .join("");
    } catch (e) {
      console.error("Failed to fetch students:", e);
      Toast.show("Failed to fetch students", "error");
    }

    const today = new Date().toISOString().split("T")[0];
    const examTypes = ["quiz", "midterm", "final", "assignment", "project"];
    const examTypeHtml = examTypes
      .map(
        (t) =>
          `<option value="${t}" ${d?.exam_type === t ? "selected" : ""}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`,
      )
      .join("");

    // HTML form
    const html = `
    <form id="gradeForm">
      <div class="form-group">
        <label for="studentSelect">Student *</label>
        <select id="studentSelect" name="studentId" required ${studentId ? "disabled" : ""}>
          ${studentsHtml}
        </select>
      </div>

      <div class="form-group">
        <label for="examTypeSelect">Exam Type *</label>
        <select id="examTypeSelect" name="examType" required>
          ${examTypeHtml}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="scoreInput">Score *</label>
          <input id="scoreInput" type="number" name="score" value="${d?.grade_score || ""}" min="0" step="0.01" required>
        </div>

        <div class="form-group">
          <label for="maxScoreInput">Max Score *</label>
          <input id="maxScoreInput" type="number" name="maxScore" value="${d?.max_score || 100}" min="1" step="0.01" required>
        </div>
      </div>

      <div class="form-group">
        <label for="recordedAtInput">Date *</label>
        <input id="recordedAtInput" type="date" name="recordedAt" value="${d?.recorded_at || today}" required>
      </div>
    </form>
  `;

    const footer = `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" id="submitBtn">${isEdit ? "Update Grade" : "Add Grade"}</button>
  `;

    Modal.show(`${isEdit ? "Update" : "Add"} Grade`, html, footer);

    // Submit handler
    document.getElementById("submitBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("gradeForm"));
      const score = parseFloat(fd.get("score"));
      const maxScore = parseFloat(fd.get("maxScore"));

      if (score > maxScore) {
        Toast.show("Score cannot exceed max score", "error");
        return;
      }

      const sid = studentId || fd.get("studentId") || d?.student_id;
      if (!sid) {
        Toast.show("Student is required", "error");
        return;
      }

      // تحقق من وجود grade ID للـ update
      if (isEdit && !d?.id) {
        Toast.show("Grade ID is missing for update", "error");
        return;
      }

      try {
        showLoading();

        if (isEdit) {
          const data = {
            student_id: sid,
            score,
            max_score: maxScore,
            exam_type: fd.get("examType"),
            recorded_at: fd.get("recordedAt"),
          };
          // PATCH مع استخدام id من الريسبونس الجديد
          await API.patch(`/teacher/updateGrade/${d.id}`, data);
        } else {
          const data = {
            studentId: sid,
            examType: fd.get("examType"),
            score,
            maxScore,
            recordedAt: fd.get("recordedAt"),
          };
          await API.post("/teacher/addGrades", data);
        }

        Toast.show(
          `Grade ${isEdit ? "updated" : "added"} successfully`,
          "success",
        );
        Modal.close();
        if (onSuccess) onSuccess();
      } catch (e) {
        console.error(e);
        Toast.show(e.message, "error");
      } finally {
        hideLoading();
      }
    };
  }

  static async showAttendanceForm(
    d = null,
    classId = null,
    studentId = null,
    onSuccess = null,
  ) {
    const isEdit = !!d;
    let studentsHtml = "";

    // جلب الطلاب من الكلاس
    try {
      const sr = await API.get(`/class/getStudents/${classId}`);
      console.log("Fetched students:", sr.data.students);

      studentsHtml = (sr.data.students || [])
        .map(
          (s) =>
            `<option value="${s.student_id}" ${
              d?.student_id === s.student_id || studentId == s.student_id
                ? "selected"
                : ""
            }>${s.student_name}</option>`,
        )
        .join("");
    } catch (e) {
      console.error("Failed to fetch students:", e);
      Toast.show("Failed to fetch students", "error");
    }

    const today = new Date().toISOString().split("T")[0];
    const statusOptions = ["present", "absent", "late", "excused"];
    const statusHtml = statusOptions
      .map(
        (s) =>
          `<option value="${s}" ${d?.status === s ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`,
      )
      .join("");

    // HTML form
    const html = `
    <form id="attendanceForm">
      <div class="form-group">
        <label for="studentSelect">Student *</label>
        <select id="studentSelect" name="studentId" required ${studentId ? "disabled" : ""}>
          ${studentsHtml}
        </select>
      </div>

      <div class="form-group">
        <label for="statusSelect">Status *</label>
        <select id="statusSelect" name="status" required>
          ${statusHtml}
        </select>
      </div>

      <div class="form-group">
        <label for="dateInput">Date *</label>
        <input id="dateInput" type="date" name="date" value="${d?.date || today}" required>
      </div>
    </form>
  `;

    const footer = `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" id="submitBtn">${isEdit ? "Update Attendance" : "Add Attendance"}</button>
  `;

    Modal.show(`${isEdit ? "Update" : "Add"} Attendance`, html, footer);

    document.getElementById("submitBtn").onclick = async () => {
      const fd = new FormData(document.getElementById("attendanceForm"));
      const sid = studentId || fd.get("studentId") || d?.student_id;

      if (!sid) {
        Toast.show("Student is required", "error");
        return;
      }

      if (isEdit && !d?.id) {
        Toast.show("Attendance ID is missing for update", "error");
        return;
      }

      try {
        showLoading();

        const data = {
          student_id: sid,
          status: fd.get("status"),
          attendance_date: fd.get("date"),
        };

        if (isEdit) {
          await API.patch(`/teacher/updateAttendance/${d.id}`, data);
        } else {
          await API.post("/teacher/addAttendance", data);
        }

        Toast.show(
          `Attendance ${isEdit ? "updated" : "added"} successfully`,
          "success",
        );
        Modal.close();
        if (onSuccess) onSuccess();
      } catch (e) {
        console.error(e);
        Toast.show(e.message, "error");
      } finally {
        hideLoading();
      }
    };
  }

static async showClassSubjectForm(d = null, classId = null, onSuccess = null) {
  const isEdit = !!d;
  let teachersHtml = "";

  try {
    const tr = await API.get("/teacher");
    teachersHtml = (tr.data.teachers || [])
      .map(t => `<option value="${t.id}" ${d?.teacher_id === t.id ? "selected" : ""}>${t.name}</option>`)
      .join("");
  } catch (e) {
    Toast.show("Failed to load teachers", "error");
  }

  const html = `
    <form id="classSubjectForm">
      <div class="form-group">
        <label>Teacher *</label>
        <select name="teacherId" required>
          ${teachersHtml}
        </select>
      </div>
      <div class="form-group">
        <label>Weekly Hours *</label>
        <input type="number" name="weeklyHours" value="${d?.weekly_hours || ""}" min="1" max="40" required>
      </div>
    </form>`;

  const footer = `
    <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
    <button class="btn btn-primary" id="submitBtn">${isEdit ? "Update" : "Add"}</button>`;

  Modal.show(`${isEdit ? "Edit" : "Add"} Class Subject`, html, footer);

  document.getElementById("submitBtn").onclick = async () => {
    const fd = new FormData(document.getElementById("classSubjectForm"));
    const data = {
      classId: classId,
      subjectId: d?.subject_id, // المادة ثابتة خلف الكواليس
      teacherId: fd.get("teacherId"),
      weeklyHours: parseInt(fd.get("weeklyHours")),
    };

    try {
      showLoading();
      if (isEdit) {
        await API.patch(`/classSubjects/${d.id}`, { 
          teacher_id: data.teacherId, 
          weekly_hours: data.weeklyHours 
        });
      } else {
        await API.post("/classSubjects", data);
      }
      Toast.show(`Class subject ${isEdit ? "updated" : "added"} successfully`, "success");
      Modal.close();
      if (onSuccess) onSuccess();
    } catch (e) {
      Toast.show(e.message, "error");
    } finally {
      hideLoading();
    }
  };
}


}
if (typeof window !== "undefined") window.Forms = Forms;
