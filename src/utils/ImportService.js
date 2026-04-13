/**
 * Utility service for handling CSV data imports
 */
export const ImportService = {
  /**
   * Parse a CSV string into an array of objects
   * @param {string} csvText - The raw CSV content
   * @param {string[]} expectedHeaders - Optional keys for the objects
   * @returns {Object[]} - Array of parsed objects
   */
  parseCSV: (csvText, expectedHeaders = []) => {
    if (!csvText) return [];

    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 1) return [];

    // Detect delimiter (comma or semicolon)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';

    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());
    const data = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim());
      const obj = {};
      
      headers.forEach((header, index) => {
        // Map user-friendly headers to system internal keys if needed
        const key = ImportService.mapHeaderToKey(header);
        obj[key] = values[index] || '';
      });
      
      return obj;
    });

    return data;
  },

  /**
   * Maps common CSV header names to internal system keys
   * @param {string} header 
   * @returns {string}
   */
  mapHeaderToKey: (header) => {
    const mappings = {
      'nom': 'nom',
      'name': 'nom',
      'full name': 'nom',
      'prénom': 'prenom',
      'email': 'email',
      'courriel': 'email',
      'téléphone': 'tel',
      'phone': 'tel',
      'mobile': 'tel',
      'poste': 'poste',
      'position': 'poste',
      'job': 'poste',
      'source': 'source',
      'score': 'score',
      'expériences': 'experience',
      'skills': 'skills',
      'compétences': 'skills'
    };

    return mappings[header.toLowerCase()] || header;
  },

  /**
   * Reads a file and returns its text content
   * @param {File} file 
   * @returns {Promise<string>}
   */
  readFileAsText: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }
};
