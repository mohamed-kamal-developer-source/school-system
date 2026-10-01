class App {
  constructor() {
    this.user = null;
    this.init();
  }

  init() {
    Auth.checkAuth();
    this.user = Auth.getUser();
    if (!this.user) {
      window.location.href = "index.html";
      return;
    }
    this.setupUI();
    this.setupEvents();
    this.loadSection("dashboard");
  }

  setupUI() {
    document.getElementById("userName").textContent = this.user.name;
    document.getElementById("userRole").textContent = this.user.role;
    this.renderSidebar();
  }

  renderSidebar() {
    const menus = {
      admin: [
        { id: "dashboard", label: "Dashboard", icon: "🏠" },
        { id: "subjects", label: "Subjects", icon: "📚" },
        { id: "classes", label: "Classes", icon: "🏫" },
        { id: "teachers", label: "Teachers", icon: "👨‍🏫" },
        { id: "students", label: "Students", icon: "👨‍🎓" },
      ],
      teacher: [
        { id: "dashboard", label: "Dashboard", icon: "🏠" },
        { id: "my-classes", label: "My Classes", icon: "🏫" },
      ],
      student: [
        { id: "dashboard", label: "Dashboard", icon: "🏠" },
        { id: "my-classes", label: "My Class", icon: "🏫" },
        { id: "my-subjects", label: "My Subjects", icon: "📚" },
        { id: "my-grades", label: "My Grades", icon: "📊" },
        { id: "my-attendance", label: "My Attendance", icon: "📋" },
      ],
    };

    const items = menus[this.user.role] || [];
    document.getElementById("sidebarMenu").innerHTML = items
      .map(
        (i) =>
          `<div class="sidebar-item" data-section="${i.id}"><span class="sidebar-icon">${i.icon}</span><span class="sidebar-label">${i.label}</span></div>`,
      )
      .join("");

    document.querySelectorAll(".sidebar-item").forEach((item) => {
      item.addEventListener("click", () => {
        document
          .querySelectorAll(".sidebar-item")
          .forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        this.loadSection(item.dataset.section);
      });
    });
    document.querySelectorAll(".sidebar-item")[0]?.classList.add("active");
  }

  setupEvents() {
    document.getElementById("logoutBtn").addEventListener("click", () => {
      Modal.confirm("Confirm Logout", "Are you sure you want to logout?", () =>
        Auth.logout(),
      );
    });
    document
      .getElementById("mobileMenuToggle")
      .addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("mobile-open");
      });
  }

  async loadSection(section) {
    const role = this.user.role;

    const adminSections = [
      "dashboard",
      "subjects",
      "classes",
      "teachers",
      "students",
    ];
    const teacherSections = ["dashboard", "my-classes"];
    const studentSections = [
      "dashboard",
      "my-classes",
      "my-subjects",
      "my-grades",
      "my-attendance",
    ];

    const allowed =
      role === "admin"
        ? adminSections
        : role === "teacher"
          ? teacherSections
          : studentSections;
    if (!allowed.includes(section)) {
      this.loadSection("dashboard");
      return;
    }

    switch (section) {
      case "dashboard":
        await this.loadDashboard();
        break;
      case "subjects":
        if (role === "admin") await AppSections.loadSubjects();
        break;
      case "classes":
        if (role === "admin") await AppSections.loadClasses();
        break;
      case "teachers":
        if (role === "admin") await AppSections.loadTeachers();
        break;
      case "students":
        if (role === "admin") await AppSections.loadStudents();
        break;
      case "my-classes":
        if (role === "teacher") await AppSections.loadTeacherClasses();
        else if (role === "student") await AppSections.loadStudentClasses();
        break;
      case "my-subjects":
        if (role === "student") await AppSections.loadStudentSubjects();
        break;
      case "my-grades":
        if (role === "student") await AppSections.loadStudentGrades();
        break;
      case "my-attendance":
        if (role === "student") await AppSections.loadStudentAttendance();
        break;
      default:
        await this.loadDashboard();
    }
  }

  async loadDashboard() {
    const cw = document.getElementById("contentWrapper");
    cw.innerHTML = `<div class="welcome-section"><h1>Welcome, ${this.user.name}</h1><div class="stats-grid" id="statsGrid"></div></div>`;
    if (this.user.role === "admin") await this.loadAdminStats();
    else if (this.user.role === "teacher") await this.loadTeacherStats();
    else this.loadStudentStats();
  }

  async loadAdminStats() {
    try {
      const [subjects, classes, teachers, students] = await Promise.all([
        API.get("/subject"),
        API.get("/class"),
        API.get("/teacher"),
        API.get("/student"),
      ]);
      document.getElementById("statsGrid").innerHTML = `
        <div class="stat-card"><span class="stat-icon">👨‍🎓</span><div class="stat-value">${students.data.students?.length || 0}</div><div class="stat-label">Total Students</div></div>
        <div class="stat-card"><span class="stat-icon">👨‍🏫</span><div class="stat-value">${teachers.data.teachers?.length || 0}</div><div class="stat-label">Total Teachers</div></div>
        <div class="stat-card"><span class="stat-icon">🏫</span><div class="stat-value">${classes.data.classes?.length || 0}</div><div class="stat-label">Total Classes</div></div>
        <div class="stat-card"><span class="stat-icon">📚</span><div class="stat-value">${subjects.data.subjects?.length || 0}</div><div class="stat-label">Total Subjects</div></div>`;
    } catch (e) {}
  }

  async loadTeacherStats() {
    try {
      const r = await API.get("/teacher/teacherClasses");
      const count = r.data.classes?.length || 0;
      document.getElementById("statsGrid").innerHTML = `
        <div class="stat-card"><span class="stat-icon">🏫</span><div class="stat-value">${count}</div><div class="stat-label">My Classes</div></div>`;
    } catch (e) {
      document.getElementById("statsGrid").innerHTML = `
        <div class="stat-card"><span class="stat-icon">🏫</span><div class="stat-value">-</div><div class="stat-label">My Classes</div></div>`;
    }
  }

  loadStudentStats() {
    document.getElementById("statsGrid").innerHTML = `
      <div class="stat-card"><span class="stat-icon">📚</span><div class="stat-value">-</div><div class="stat-label">My Subjects</div></div>
      <div class="stat-card"><span class="stat-icon">📊</span><div class="stat-value">-</div><div class="stat-label">My Grades</div></div>
      <div class="stat-card"><span class="stat-icon">📋</span><div class="stat-value">-</div><div class="stat-label">Attendance</div></div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
