/**
 * 🛠️ NEXUS OS: DATA INTEGRITY & VALIDATION TOOL
 * Prevents duplicates, checks schema compliance, and ensures data quality 
 * during the re-import phase following a "Nuclear Wipe".
 */

export const validateEmployeeData = (data, existingUsers) => {
  const errors = [];
  const emails = new Set(existingUsers.map(u => u.email.toLowerCase()));

  if (!data.email) errors.push("Missing required field: email");
  if (data.email && emails.has(data.email.toLowerCase())) {
    errors.push(`Duplicate email detected: ${data.email}`);
  }

  if (!data.firstName || !data.lastName) {
    errors.push("Missing required field: firstName or lastName");
  }

  // Check HR alignment
  if (!data.department || !data.role) {
    errors.push("Missing governance fields: department or role");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAssetData = (data, existingAssets) => {
  const errors = [];
  const serials = new Set(existingAssets.map(a => a.serial_number));

  if (!data.serial_number) errors.push("Missing required field: serial_number");
  if (data.serial_number && serials.has(data.serial_number)) {
    errors.push(`Duplicate serial number detected: ${data.serial_number}`);
  }

  if (!data.asset_type) errors.push("Missing asset type");

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 🚀 BULK VALIDATOR
 * Processes an array of items and returns a report.
 */
export const runValidationReport = (items, type, contextData) => {
  const report = {
    total: items.length,
    valid: 0,
    invalid: 0,
    details: []
  };

  items.forEach((item, index) => {
    let result;
    if (type === 'employee') result = validateEmployeeData(item, contextData.users);
    if (type === 'asset') result = validateAssetData(item, contextData.assets);

    if (result.isValid) {
      report.valid++;
    } else {
      report.invalid++;
      report.details.push({ index, errors: result.errors, item });
    }
  });

  return report;
};
