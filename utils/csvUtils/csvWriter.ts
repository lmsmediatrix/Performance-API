export function arrayToCSV(data: any[], fields?: string[]): string {
  if (!data || !Array.isArray(data) || data.length === 0) return "";

  const headers = fields || Object.keys(data[0]);
  const escape = (val: any) => {
    if (val == null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const csvRows = [headers.join(",")];
  for (const row of data) {
    csvRows.push(headers.map((h) => escape(row[h])).join(","));
  }
  return csvRows.join("\n");
}
