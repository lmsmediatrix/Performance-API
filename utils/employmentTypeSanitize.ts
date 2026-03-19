/**
 * Sanitizes employment type values to ensure consistent formatting
 * @param value The employment type value to sanitize
 * @returns Standardized employment type string
 */
export function sanitizeEmploymentType(value: string | undefined): string {
  if (!value) return "";

  // Convert to lowercase and trim
  const normalized = value.toString().toLowerCase().trim();

  // Map to standardized values with proper formatting
  const mapping: Record<string, string> = {
    part_time: "Part-time",
    "part time": "Part-time",
    parttime: "Part-time",
    probationary: "Probationary",
    full_time: "Full-time",
    "full time": "Full-time",
    fulltime: "Full-time",
    internship: "Internship",
    freelance: "Freelance",
    temporary: "Temporary",
    volunteer: "Volunteer",
    retired: "Retired",
    resigned: "Resigned",
  };

  return mapping[normalized] || value;
}
