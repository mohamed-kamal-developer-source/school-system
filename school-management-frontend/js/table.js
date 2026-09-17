class DataTable {
  constructor(opts) {
    this.data = opts.data || [];
    this.columns = opts.columns || [];
    this.actions = opts.actions || [];
    this.containerId = opts.containerId;
    this.searchable = opts.searchable !== false;
    this.sortable = opts.sortable !== false;
    this.paginated = opts.paginated !== false;
    this.itemsPerPage = opts.itemsPerPage || 10;
    this.currentPage = 1;
    this.filteredData = [...this.data];
    this.sortField = null;
    this.sortDir = 'asc';
    this.onAction = opts.onAction || null;
    this._searchTerm = '';
  }

  render() {
    const c = document.getElementById(this.containerId);
    if (!c) return;
    c.innerHTML = `<div class="data-table-container">
      ${this.searchable ? `<div class="table-controls"><div class="search-box"><input type="text" id="search_${this.containerId}" placeholder="Search..." value="${this._searchTerm}"></div></div>` : ''}
      <div class="table-wrapper"><table class="data-table">
        <thead>${this.renderHeader()}</thead>
        <tbody>${this.renderBody()}</tbody>
      </table></div>
      ${this.paginated ? this.renderPagination() : ''}
    </div>`;
    this.attachEvents();
  }

  renderHeader() {
    return `<tr>${this.columns.map((c, i) =>
      `<th class="${this.sortable ? 'sortable' : ''}" data-field="${c.field}">${i === 0 ? '#' : c.label}${this.sortable ? ' ⇅' : ''}</th>`
    ).join('')}${this.actions.length ? '<th>Actions</th>' : ''}</tr>`;
  }

  renderBody() {
    const d = this.getPaginatedData();
    if (!d.length) return `<tr><td colspan="${this.columns.length + (this.actions.length ? 1 : 0)}" class="no-data">No data available</td></tr>`;
    return d.map((r, idx) =>
      `<tr>${this.columns.map((c, i) =>
        `<td>${i === 0 ? this.getRowNumber(idx) : this.formatCell(r[c.field], c, r)}</td>`
      ).join('')}${this.actions.length ? `<td><div class="actions-cell">${this.renderActions(r)}</div></td>` : ''}</tr>`
    ).join('');
  }

  getRowNumber(idx) { return ((this.currentPage - 1) * this.itemsPerPage) + idx + 1; }

  formatCell(v, c, r) {
    if (c.format) return c.format(v, c, r);
    return v != null ? v : 'N/A';
  }

  renderActions(r) {
    return this.actions.map(a =>
      `<button class="btn-icon ${a.class}" data-id="${r.id}" data-action="${a.action}" title="${a.label}">${a.icon}</button>`
    ).join('');
  }

  renderPagination() {
    const tp = Math.ceil(this.filteredData.length / this.itemsPerPage);
    if (tp <= 1) return '';
    const s = ((this.currentPage - 1) * this.itemsPerPage) + 1;
    const e = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
    return `<div class="pagination">
      <span class="pagination-info">Showing ${s}-${e} of ${this.filteredData.length}</span>
      <div class="pagination-controls">
        <button class="pagination-btn" id="prev_${this.containerId}" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
        <span class="pagination-info">Page ${this.currentPage} of ${tp}</span>
        <button class="pagination-btn" id="next_${this.containerId}" ${this.currentPage === tp ? 'disabled' : ''}>Next</button>
      </div>
    </div>`;
  }

  getPaginatedData() {
    const s = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(s, s + this.itemsPerPage);
  }

  attachEvents() {
    if (this.searchable) {
      const si = document.getElementById(`search_${this.containerId}`);
      if (si) {
        // Restore cursor position after re-render
        si.focus();
        const len = si.value.length;
        si.setSelectionRange(len, len);
        si.addEventListener('input', (e) => this.handleSearch(e.target.value));
      }
    }

    if (this.sortable) {
      document.querySelectorAll(`#${this.containerId} th.sortable`).forEach(th => {
        th.addEventListener('click', () => this.handleSort(th.dataset.field));
      });
    }

    if (this.paginated) {
      const pb = document.getElementById(`prev_${this.containerId}`);
      const nb = document.getElementById(`next_${this.containerId}`);
      if (pb) pb.addEventListener('click', () => this.goToPage(this.currentPage - 1));
      if (nb) nb.addEventListener('click', () => this.goToPage(this.currentPage + 1));
    }

    document.querySelectorAll(`#${this.containerId} .actions-cell button`).forEach(b => {
      b.addEventListener('click', () => {
        if (this.onAction) this.onAction(b.dataset.action, b.dataset.id);
      });
    });
  }

  handleSearch(term) {
    this._searchTerm = term;
    const t = term.toLowerCase();
    this.filteredData = this.data.filter(r =>
      this.columns.some(c => {
        const v = String(r[c.field] || '').toLowerCase();
        return v.includes(t);
      })
    );
    this.currentPage = 1;
    this.render();
  }

  handleSort(field) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.filteredData.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return this.sortDir === 'asc' ? -1 : 1;
      if (av > bv) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    this.render();
  }

  goToPage(p) {
    const tp = Math.ceil(this.filteredData.length / this.itemsPerPage);
    if (p < 1 || p > tp) return;
    this.currentPage = p;
    this.render();
  }

  updateData(nd) {
    this.data = nd;
    this.filteredData = [...nd];
    this._searchTerm = '';
    this.currentPage = 1;
    this.render();
  }
}
if (typeof window !== 'undefined') window.DataTable = DataTable;
