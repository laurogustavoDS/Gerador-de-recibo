import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { fillTemplate, getCurrentDate } from './receiptTemplate.js';

/**
 * Generates PDFs for all employees and returns a ZIP file as a Blob.
 * @param {Array} employeesData Array of employee objects with mapped keys.
 * @param {number} startReceiptNumber
 * @returns {Promise<Blob>} ZIP file containing all PDFs
 */
export async function generateReceipts(employeesData, startReceiptNumber = 1) {
    console.log('📄 Starting PDF generation...');
    console.log('👥 Employees data:', employeesData);
    console.log('🔢 Starting receipt number:', startReceiptNumber);

    if (!employeesData || employeesData.length === 0) {
        throw new Error('No employee data provided');
    }

    const zip = new JSZip();
    let currentReceiptNumber = Number(startReceiptNumber);
    let pdfCount = 0;

    // Create a temporary container for rendering HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm'; // A4 width
    container.style.background = 'white';
    document.body.appendChild(container);

    try {
        for (const employee of employeesData) {
            console.log(`\n📋 Processing employee:`, employee);

            if (!employee.name) {
                console.warn('⚠️ Skipping employee without name:', employee);
                continue;
            }

            // Fill template with employee data
            const filledHtml = fillTemplate(employee, currentReceiptNumber);
            console.log(`✏️ Filled template for ${employee.name}`);

            container.innerHTML = filledHtml;

            // Wait a bit for fonts and styles to load
            await new Promise(resolve => setTimeout(resolve, 100));

            // Convert HTML to canvas
            console.log(`🎨 Converting to canvas for ${employee.name}...`);
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            console.log(`✅ Canvas created: ${canvas.width}x${canvas.height}`);

            // Create PDF from canvas
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            console.log(`📄 PDF created for ${employee.name}`);

            // Generate filename
            const filename = `Recibo - ${employee.name} - ${getCurrentDate()}.pdf`;
            console.log(`💾 Filename: ${filename}`);

            // Add PDF to ZIP
            const pdfBlob = pdf.output('blob');
            console.log(`📦 PDF blob size: ${pdfBlob.size} bytes`);

            zip.file(filename, pdfBlob);
            pdfCount++;
            console.log(`✅ Added to ZIP (${pdfCount} PDFs so far)`);

            currentReceiptNumber++;
        }
    } catch (error) {
        console.error('❌ Error during PDF generation:', error);
        throw error;
    } finally {
        // Clean up
        document.body.removeChild(container);
        console.log('🧹 Cleaned up temporary container');
    }

    console.log(`\n📊 Summary: Generated ${pdfCount} PDFs`);

    if (pdfCount === 0) {
        throw new Error('No PDFs were generated. Please check if employee data has valid names.');
    }

    // Generate ZIP file
    console.log('🗜️ Creating ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    console.log(`✅ ZIP created: ${zipBlob.size} bytes`);

    return zipBlob;
}

