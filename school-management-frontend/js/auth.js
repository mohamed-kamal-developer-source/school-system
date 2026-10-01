const API_BASE_URL = "http://localhost:3232/api/v1";

class Auth {
  static async login(email, password) {
    const r = await fetch(`${API_BASE_URL}/users/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.message || "Invalid credentials");
    }
    const d = await r.json();
    const u = d.data?.user || d.data;
    if (!u) throw new Error("Invalid server response");
    const role = (u.role || "student").toLowerCase();
    localStorage.setItem("authToken", u.token);
    localStorage.setItem(
      "user",
      JSON.stringify({ id: u.id, name: u.name, email: u.email, role }),
    );
    window.location.href = "dashboard.html";
  }

  static logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }

  static isAuthenticated() {
    return !!localStorage.getItem("authToken");
  }

  static getUser() {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  }

  static getToken() {
    return localStorage.getItem("authToken");
  }

  static checkAuth() {
    if (!this.isAuthenticated()) window.location.href = "index.html";
  }

  static checkRole(allowedRoles) {
    const user = this.getUser();
    if (!user || !allowedRoles.includes(user.role)) {
      window.location.href = "dashboard.html";
      return false;
    }
    return true;
  }
}

if (typeof window !== "undefined") window.Auth = Auth;
