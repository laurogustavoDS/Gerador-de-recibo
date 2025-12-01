import * as XLSX from 'xlsx';

const COLUMN_MAPPINGS = {
    name: /(nome|name|funcionario|employee|colaborador)/i,
    diasDiurnos: /(dias?\s*diurnos?|day\s*shifts?|diurno)/i,
    diasNoturnos: /(dias?\s*noturnos?|night\s*shifts?|noturno)/i,
    baseSalary: /(sal[aá]rio\s*base|base\s*salary)/i,
    beneficios: /(benef[ií]cios?)/i,
    bonus5: /(b[oô]nus\s*de?\s*5%?|bonus\s*5%?)/i,
    descontos: /(descontos?|discounts?)/i,
    total: /(total)/i,
};

/**
 * Detects which column index corresponds to which field based on headers.
 * @param {string[]} headers 
 * @returns {Object} Mapping of field -> columnIndex (or null if not found)
 */
function detectColumns(headers) {
    const mapping = {};

    // Initialize all keys to null
    Object.keys(COLUMN_MAPPINGS).forEach(key => mapping[key] = null);

    headers.forEach((header, index) => {
        const cleanHeader = String(header).trim();

        for (const [key, regex] of Object.entries(COLUMN_MAPPINGS)) {
            if (!mapping[key] && regex.test(cleanHeader)) {
                mapping[key] = header; // Store the actual header name
            }
        }
    });

    return mapping;
}

/**
 * Parses the uploaded Excel file from a File object (browser).
 * @param {File} file - The File object from input[type=file]
 * @returns {Promise<Object>} { headers, data, mapping }
 */
export async function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON with header: 1 to get raw array of arrays
                const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (rawData.length === 0) {
                    reject(new Error("Excel file is empty"));
                    return;
                }

                // Assume first row is headers
                const headers = rawData[0];
                const rows = rawData.slice(1);

                const mapping = detectColumns(headers);

                console.log('📊 Excel Headers:', headers);
                console.log('🔍 Column Mapping:', mapping);
                console.log('📝 Total Rows:', rows.length);

                // Convert rows to objects based on mapping
                const structuredData = rows.map((row, rowIndex) => {
                    // Skip empty rows
                    if (!row || row.length === 0) return null;

                    const rowData = {};

                    // Map normalized keys based on detected headers
                    Object.entries(mapping).forEach(([key, headerName]) => {
                        if (headerName) {
                            const colIndex = headers.indexOf(headerName);
                            if (colIndex !== -1) {
                                const value = row[colIndex];

                                // Handle different value types
                                if (value !== undefined && value !== null && value !== '') {
                                    // For numeric fields, ensure we parse them correctly
                                    if (key !== 'name' && !isNaN(value)) {
                                        rowData[key] = Number(value);
                                    } else {
                                        rowData[key] = value;
                                    }
                                }
                            }
                        }
                    });

                    // Log each row for debugging
                    if (rowIndex < 3) { // Log first 3 rows
                        console.log(`Row ${rowIndex + 1}:`, rowData);
                    }

                    // Use total from spreadsheet if available, otherwise calculate
                    if (!rowData.total && rowData.baseSalary !== undefined) {
                        // Total = Salário Base + Benefícios + Bônus 5% - Descontos
                        const salary = Number(rowData.baseSalary) || 0;
                        const benefits = Number(rowData.beneficios) || 0;
                        const bonus = Number(rowData.bonus5) || 0;
                        const discounts = Number(rowData.descontos) || 0;

                        rowData.total = salary + benefits + bonus - discounts;
                    }

                    return rowData;
                }).filter(r => r !== null && r.name); // Filter out null rows and rows without names

                resolve({
                    headers,
                    data: structuredData,
                    mapping
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

export { detectColumns };
