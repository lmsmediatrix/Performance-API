export function transformOrganizationAnalytics(facetResults: any[]): any {
  if (!facetResults || !facetResults[0]) {
    return {};
  }

  const result = facetResults[0];
  const transformed: any = {};
  Object.keys(result).forEach((key) => {
    const value = result[key];
    if (!value) {
      transformed[key] = value;
      return;
    }

    if (Array.isArray(value)) {
      if (["studentsPerCourse", "studentPerSection"].includes(key)) {
        transformed[key] = value;
        return;
      }
      if (key === "coursesToAssign" && value.length === 1) {
        transformed[key] = value[0];
        return;
      }
      if (key === "studentByStatus" && value.length === 1) {
        transformed[key] = value[0];
        return;
      }
      if (value.length === 1 && value[0] && typeof value[0].total === "number") {
        transformed[key] = value[0].total;
        return;
      }
      transformed[key] = value;
    } else {
      transformed[key] = value;
    }
  });

  return transformed;
}
