/**
 * Utility function to convert dot notation form fields into nested objects
 * Example: { 'branding.colors.primary': '#ff0000' } becomes { branding: { colors: { primary: '#ff0000' } } }
 */
export function processNestedFormData(formData: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in formData) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      current[parts[parts.length - 1]] = formData[key];
    } else {
      result[key] = formData[key];
    }
  }

  return result;
}
