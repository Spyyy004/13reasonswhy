const express = require('express');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const csvParser = require('csv-parser');
const nodemailer = require('nodemailer'); // Import nodemailer
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

// Other endpoints here...

// Start the server
app.listen(PORT, () => {
    console.log(`SpendorMentor server is running on port ${PORT}`);
});
