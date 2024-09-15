const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const csvParser = require('csv-parser');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(fileUpload()); // Enable file upload support
app.use(cors());
  

const PORT = process.env.PORT || 3000;

// Create uploads directory if it does not exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Endpoint to upload and parse PDF bank statements
app.post('/upload-pdf', async (req, res) => {
    const file = req.files && req.files.pdfFile; // Check if file is provided

    if (!file) {
        return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    const sanitizedFileName = file.name.replace(/\s+/g, '_');
    const tempFilePath = path.join(uploadsDir, sanitizedFileName);

    try {
        await file.mv(tempFilePath); // Move file to the uploads directory

        const pdfBytes = fs.readFileSync(tempFilePath);
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

        let pdfTextContent = '';
        const pages = pdfDoc.getPages();
        for (const page of pages) {
            const { text } = await page.getTextContent();
            pdfTextContent += text;
        }

        const transactions = parsePDFToTransactions(pdfTextContent);

        fs.unlinkSync(tempFilePath);

        res.json({
            success: true,
            message: 'PDF parsed successfully',
            transactions,
        });
    } catch (error) {
        console.error('Error parsing PDF:', error);
        res.status(500).json({ success: false, message: 'Error parsing PDF', error: error.message });
    }
});

// Endpoint to upload and parse CSV bank statements
app.post('/upload-csv', async (req, res) => {
    const file = req.files && req.files.csvFile; // Check if file is provided

    if (!file) {
        return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    const sanitizedFileName = file.name.replace(/\s+/g, '_');
    const tempFilePath = path.join(uploadsDir, sanitizedFileName);

    try {
        await file.mv(tempFilePath); // Move file to the uploads directory

        const transactions = [];
        fs.createReadStream(tempFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                transactions.push(row);
            })
            .on('end', () => {
                fs.unlinkSync(tempFilePath);

                res.json({
                    success: true,
                    message: 'CSV parsed successfully',
                    transactions,
                });
            })
            .on('error', (error) => {
                console.error('Error parsing CSV:', error);
                res.status(500).json({ success: false, message: 'Error parsing CSV', error: error.message });
            });
    } catch (error) {
        console.error('Error processing CSV upload:', error);
        res.status(500).json({ success: false, message: 'Error processing CSV upload', error: error.message });
    }
});

// Function to parse PDF text into transaction objects (mock function, customize based on your PDF format)
function parsePDFToTransactions(pdfText) {
    console.log(pdfText, "AOOAOAOA");
    const transactions = [];
    const lines = pdfText.split('\n');

    lines.forEach(line => {
        const parts = line.split('|');
        if (parts.length === 4) {
            transactions.push({
                date: parts[0].trim(),
                amount: parseFloat(parts[1].trim()),
                category: parts[2].trim(),
                description: parts[3].trim(),
            });
        }
    });

    return transactions;
}

// Endpoint to generate AI spending insights
app.post('/generate-insights', async (req, res) => {
    const { idea } = req.body;

    const prompt = `Here is my startup idea ${idea}. I want you to think like an experienced VC, businessman, and an industrialist and give me. Give genuine reasons which can act as a great feedback for me:
    1. 13 reasons why this idea will succeed
    2. 13 reasons why this idea will fail
    Don't give any other response, just give the output in the following format
    
    {
        "success": ["Reason 1","Reason 2"],
        "failure":["Reason 1", "Reason 2"]
    }
    `;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini', // Use the latest OpenAI model
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1500,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Extract the response content
        const responseData = response.data.choices[0].message.content;

        // Parse the response content as JSON
        let parsedData;
        try {
            parsedData = JSON.parse(responseData);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Failed to parse response', error: error.message });
        }

        // Return only the success and failure arrays
        const { success = [], failure = [] } = parsedData;

        res.json({
            success: true,
            insights: {
                success,
                failure
            }
        });
    } catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ success: false, message: 'Error generating insights', error: error.message });
    }
});

// Endpoint to generate spending challenges
app.post('/generate-challenges', (req, res) => {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ success: false, message: 'No transactions provided' });
    }

    let maxCategory = '';
    let maxAmount = 0;
    const categories = {};

    transactions.forEach((transaction) => {
        const category = transaction.category || 'Misc';
        const amount = parseFloat(transaction.amount);

        if (isNaN(amount)) return; // Skip invalid amounts

        if (!categories[category]) categories[category] = 0;
        categories[category] += amount;

        if (categories[category] > maxAmount) {
            maxAmount = categories[category];
            maxCategory = category;
        }
    });

    const challenge = `Your biggest spending is on ${maxCategory} ($${maxAmount.toFixed(2)}). Try reducing this by 10% next week!`;

    res.json({
        success: true,
        challenge,
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`SpendorMentor server is running on port ${PORT}`);
});
