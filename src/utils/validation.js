/**
 * Schema Validation Utility
 * Validates data against the ERP schema definitions.
 */

export const validateData = (schema, data) => {
  if (!schema || !schema.fields) return { valid: true };

  const errors = [];
  const fields = schema.fields;

  Object.entries(fields).forEach(([fieldName, config]) => {
    const value = data[fieldName];

    // Required check
    if (config.required && (value === undefined || value === null || value === '')) {
      errors.push(`${config.label || fieldName} est requis.`);
      return;
    }

    if (value === undefined || value === null || value === '') return;

    // Type checks
    switch (config.type) {
      case 'number':
      case 'money':
        if (isNaN(parseFloat(value))) {
          errors.push(`${config.label || fieldName} doit être un nombre.`);
        }
        break;
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${config.label || fieldName} n'est pas un email valide.`);
        }
        break;
      }
      case 'selection':
      case 'select':
        if (config.options && !config.options.some(opt => (opt.value || opt) === value)) {
          errors.push(`Valeur invalide pour ${config.label || fieldName}.`);
        }
        break;
      default:
        break;
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};
