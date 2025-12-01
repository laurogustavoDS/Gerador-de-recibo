import Tesseract from 'tesseract.js';

/**
 * Processes an image file using OCR to extract text and parse employee data
 * @param {File} file - The image file (JPEG or PNG)
 * @returns {Promise<Object>} { headers, data, mapping }
 */
export async function parseImage(file) {
    try {
        console.log('🖼️ Starting OCR processing for:', file.name);

        // Perform OCR on the image
        const result = await Tesseract.recognize(
            file,
            'por', // Portuguese language
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        const text = result.data.text;
        console.log('📝 Extracted text:', text);

        // Parse the extracted text to find employee data
        const parsedData = parseOCRText(text);

        return parsedData;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to process image. Please ensure the image contains clear, readable text.');
    }
}

/**
 * Parses OCR text to extract employee data
 * @param {string} text - The extracted text from OCR
 * @returns {Object} { headers, data, mapping }
 */
function parseOCRText(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Try to detect if this is a table format
    const employees = [];

    // Simple pattern matching for common formats
    // Example: "João Silva - R$ 1000,00 - R$ 150,00 - R$ 200,00"
    // Or: "Nome: João Silva\nSalário: 1000\nExtra: 150"

    let currentEmployee = null;

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Try to detect name (usually starts with capital letter and contains spaces)
        const nameMatch = trimmedLine.match(/^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+)+)/);

        if (nameMatch) {
            // Start a new employee record
            if (currentEmployee && currentEmployee.name) {
                employees.push(currentEmployee);
            }
            currentEmployee = { name: nameMatch[1] };
        }

        // Try to extract numbers (salary, extra, bonus, health)
        const numbers = trimmedLine.match(/\d+[.,]?\d*/g);

        if (numbers && currentEmployee) {
            // Try to identify what each number represents based on keywords
            const lowerLine = trimmedLine.toLowerCase();

            if (lowerLine.includes('base') || lowerLine.includes('salário') || lowerLine.includes('salario')) {
                currentEmployee.baseSalary = parseNumber(numbers[0]);
            } else if (lowerLine.includes('extra') || lowerLine.includes('adicional')) {
                currentEmployee.extra = parseNumber(numbers[0]);
            } else if (lowerLine.includes('bonus') || lowerLine.includes('bônus') || lowerLine.includes('gratificação')) {
                currentEmployee.bonus = parseNumber(numbers[0]);
            } else if (lowerLine.includes('saúde') || lowerLine.includes('saude') || lowerLine.includes('plano')) {
                currentEmployee.health = parseNumber(numbers[0]);
            } else if (!currentEmployee.baseSalary && numbers.length > 0) {
                // If no keyword, assume first number is base salary
                currentEmployee.baseSalary = parseNumber(numbers[0]);
                if (numbers.length > 1) currentEmployee.extra = parseNumber(numbers[1]);
                if (numbers.length > 2) currentEmployee.bonus = parseNumber(numbers[2]);
                if (numbers.length > 3) currentEmployee.health = parseNumber(numbers[3]);
            }
        }
    }

    // Add the last employee
    if (currentEmployee && currentEmployee.name) {
        employees.push(currentEmployee);
    }

    // Calculate totals
    employees.forEach(emp => {
        if (!emp.total) {
            emp.total = (emp.baseSalary || 0) +
                (emp.extra || 0) +
                (emp.bonus || 0) +
                (emp.health || 0);
        }
    });

    console.log('👥 Parsed employees:', employees);

    // Create mapping similar to Excel service
    const mapping = {
        name: 'Nome (detectado via OCR)',
        baseSalary: 'Salário Base (detectado)',
        extra: 'Extra (detectado)',
        bonus: 'Bônus (detectado)',
        health: 'Saúde (detectado)'
    };

    return {
        headers: ['Nome', 'Salário Base', 'Extra', 'Bônus', 'Saúde'],
        data: employees,
        mapping: mapping
    };
}

/**
 * Helper to parse number from string (handles both . and , as decimal separator)
 */
function parseNumber(str) {
    if (!str) return 0;
    // Remove currency symbols and spaces
    const cleaned = str.toString().replace(/[R$\s]/g, '');
    // Replace comma with dot for decimal
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
}
