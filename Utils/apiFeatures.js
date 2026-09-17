class apiFeatures {
  constructor(
    query,
    allowedFilters,
    allowedSortFields,
    searchFields = [],
    initialValues = [],
  ) {
    this.query = query;
    this.allowedFilters = allowedFilters;
    this.allowedSortFields = allowedSortFields;
    this.searchFields = searchFields;

    this.conditions = [];
    this.values = [...initialValues];
    this.orderClause = "";
    this.paginationClause = "";
  }

  filter() {
    for (const key in this.query) {
      if (!this.allowedFilters.includes(key)) continue;

      const value = this.query[key];

      if (typeof value === "object") {
        const operators = { gte: ">=", gt: ">", lte: "<=", lt: "<" };

        for (const op in value) {
          if (operators[op]) {
            const placeholderIndex = this.values.length + 1;
            this.conditions.push(
              `${key} ${operators[op]} $${placeholderIndex}`,
            );
            this.values.push(value[op]);
          }
        }

        continue;
      }

      const placeholderIndex = this.values.length + 1;
      this.conditions.push(`${key} = $${placeholderIndex}`);
      this.values.push(value);
    }

    return this;
  }

  search() {
    if (!this.query.search || !this.searchFields.length) return this;

    const value = this.query.search;

    const searchConditions = this.searchFields.map((field) => {
      const placeholderIndex = this.values.length + 1;
      this.values.push(`%${value}%`);
      return `${field} ILIKE $${placeholderIndex}`;
    });

    this.conditions.push(`(${searchConditions.join(" OR ")})`);

    return this;
  }

  sort() {
    if (!this.query.sort) return this;

    let sortField = this.query.sort;
    let direction = "ASC";

    if (sortField.startsWith("-")) {
      direction = "DESC";
      sortField = sortField.substring(1);
    }

    if (this.allowedSortFields.includes(sortField)) {
      this.orderClause = `ORDER BY ${sortField} ${direction}`;
    }

    return this;
  }

  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const offset = (page - 1) * limit;

    const limitIndex = this.values.length + 1;
    const offsetIndex = this.values.length + 2;

    this.values.push(limit, offset);

    this.paginationClause = `LIMIT $${limitIndex} OFFSET $${offsetIndex}`;

    return this;
  }

  build() {
    return {
      whereClause: this.conditions.length
        ? "AND " + this.conditions.join(" AND ")
        : "",
      orderClause: this.orderClause,
      paginationClause: this.paginationClause,
      values: this.values,
    };
  }
}

module.exports = apiFeatures;
