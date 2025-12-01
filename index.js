const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseExcel } = require('./services/excelService');
const { generateReceipts } = require('./services/pdfService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload configuration
const upload = multer({ dest: 'uploads/' });

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Receipt Generator API is running' });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = parseExcel(req.file.path);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'File processed successfully',
            filename: req.file.filename,
            headers: result.headers,
            mapping: result.mapping,
            data: result.data
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process upload' });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const { data, startReceiptNumber } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data provided' });
        }

        const zipPath = await generateReceipts(data, startReceiptNumber || 1);

        res.download(zipPath, 'recibos.zip', (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            // Optional: delete zip after download?
        });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: 'Failed to generate receipts' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
