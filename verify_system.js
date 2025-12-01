const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { parseExcel } = require('./services/excelService');
const { generateReceipts } = require('./services/pdfService');

async function runVerification() {
    console.log('Starting Verification...');

    // 1. Create Sample Excel
    const data = [
        ["Nome do Funcionário", "Base Salary", "Extra", "Bonus", "Health Insurance", "Total"],
        ["João Silva", 1000, 50, 100, 20, 1170],
        ["Maria Santos", 2000, 0, 200, 50, 2250]
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");

    const testFilePath = path.join(__dirname, 'test_employees.xlsx');
    xlsx.writeFile(wb, testFilePath);
    console.log('1. Created test Excel file:', testFilePath);

    // 2. Test Parsing
    try {
        console.log('2. Testing Excel Parsing...');
        const result = parseExcel(testFilePath);
        console.log('   Detected Headers:', result.headers);
        console.log('   Column Mapping:', result.mapping);
        console.log('   Parsed Rows:', result.data.length);
        console.log('   Sample Row:', result.data[0]);

        if (result.data.length !== 2) throw new Error('Expected 2 rows');
        // Check normalized data
        if (result.data[0].name !== 'João Silva') throw new Error('Name mapping failed: ' + result.data[0].name);
        if (result.data[0].baseSalary !== 1000) throw new Error('Salary mapping failed');

        // 3. Test PDF Generation
        console.log('3. Testing PDF Generation...');
        const zipPath = await generateReceipts(result.data, 100);
        console.log('   PDFs generated at:', zipPath);

        if (!fs.existsSync(zipPath)) throw new Error('ZIP file not created');

        console.log('VERIFICATION SUCCESSFUL!');
    } catch (err) {
        console.error('Verification Failed:', err);
        process.exit(1);
    }
}

runVerification();
