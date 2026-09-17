class Details {
  constructor() {
    Auth.checkAuth();
    const params = new URLSearchParams(window.location.search);
    this.type = params.get('type');
    this.id = params.get('id');
    if (!this.type || !this.id) { window.location.href = '../dashboard.html'; return; }
    this.load();
  }

  async load() {
    try {
      showLoading();
      const r = await API.get(`/${this.type}/${this.id}`);
      const data = r.data[this.type];
      if (!data) throw new Error('No data');
      this.render(data);
      if (this.type === 'class') await this.loadClassRelated();
    } catch (e) {
      Toast.show('Failed to load details', 'error');
      setTimeout(() => goBack(), 2000);
    } finally { hideLoading(); }
  }

  render(data) {
    const exclude = ['id', 'user_id', 'password', 'token'];
    const fields = Object.keys(data).filter(k => !exclude.includes(k) && !k.endsWith('_id'));
    const html = `
      <h2>${this.type.charAt(0).toUpperCase() + this.type.slice(1)} Details</h2>
      <div class="details-grid">
        ${fields.map(f => `
          <div class="detail-card">
            <label>${f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
            <p>${data[f] != null ? data[f] : 'N/A'}</p>
          </div>`).join('')}
      </div>`;
    document.getElementById('detailsContent').innerHTML = html;
  }

  async loadClassRelated() {
    try {
      const [subjectsRes, teachersRes] = await Promise.all([
        API.get(`/class/getSubjects/${this.id}`),
        API.get(`/class/getTeachers/${this.id}`)
      ]);
      const subjects = subjectsRes.data.subjects || [];
      const teachers = teachersRes.data.teachers || [];
      let html = '<h3 style="margin-top:24px;margin-bottom:16px">Related Information</h3><div class="form-row">';
      if (subjects.length) {
        html += `<div class="card"><h4>Subjects</h4><ul class="detail-list">${subjects.map(s => `<li>${s.subject_name || s.name}</li>`).join('')}</ul></div>`;
      }
      if (teachers.length) {
        html += `<div class="card"><h4>Teachers</h4><ul class="detail-list">${teachers.map(t => `<li>${t.teacher_name || t.name}${t.subject_name ? ' — ' + t.subject_name : ''}</li>`).join('')}</ul></div>`;
      }
      html += '</div>';
      document.getElementById('detailsContent').innerHTML += html;
    } catch (e) {}
  }
}

document.addEventListener('DOMContentLoaded', () => { new Details(); });
