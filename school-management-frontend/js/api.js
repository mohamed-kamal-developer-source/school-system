class API {
  static async req(e, o = {}) {
    const method = o.method || "GET";

    const t = Auth.getToken();
    const h = {
      "Content-Type": "application/json",
      ...(t && { Authorization: `Bearer ${t}` }),
      ...o.headers,
    };

    try {
      const r = await fetch(`${API_BASE_URL}${e}`, {
        ...o,
        method,
        headers: h,
      });

      if (r.status === 401) {
        Auth.logout();
        return;
      }

      let data = null;

      try {
        data = await r.json();
      } catch {
        data = null;
      }

      // لو GET و 404 → No data
      if (r.status === 404) {
        return {
          status: "success",
          results: 0,
          data: {},
        };
      }

      // أي status غير 2xx → يرمي Error
      if (!r.ok) {
        const message = data?.message || `HTTP ${r.status}`;
        const error = new Error(message);
        error.status = r.status;
        error.data = data;
        throw error; // 🔥 هنا throw للخارج
      }

      return data;
    } catch (err) {
      // ❌ ما تعملش Toast هنا
      // ❌ ما ترجّعش resolve
      throw err; // 🔥 خلي الـ error يطلع للـ caller
    }
  }

  static get(e, p = {}) {
    const q = new URLSearchParams(p).toString();
    return this.req(q ? `${e}?${q}` : e, { method: "GET" });
  }
  static post(e, d) {
    return this.req(e, { method: "POST", body: JSON.stringify(d) });
  }
  static patch(e, d) {
    return this.req(e, { method: "PATCH", body: JSON.stringify(d) });
  }
  static del(e, d) {
    return this.req(e, {
      method: "DELETE",
      ...(d && { body: JSON.stringify(d) }),
    });
  }
}
if (typeof window !== "undefined") window.API = API;
