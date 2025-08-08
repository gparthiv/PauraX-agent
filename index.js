const express = require('express');
const axios = require('axios');
require('dotenv').config();
const twilio = require('twilio');
const fs = require('fs'); // Using the File System module to read/write our db

const app = express();
const PORT = 3000;

// --- Initialize Clients, Constants, and "Memory" ---
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = new twilio(accountSid, authToken);
const twilioNumber = 'whatsapp:+14155238886';
const dbPath = './db.json'; // The path to our mock database

// Simple in-memory "short-term memory" to track conversations
const userState = {};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- IBM AUTHENTICATION ---
async function getIAMToken(apiKey) {
    if (!apiKey) {
        console.error("ERROR: API Key not provided for IAM Token generation.");
        return null;
    }
    const url = 'https://iam.cloud.ibm.com/identity/token';
    const data = `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`;
    try {
        const response = await axios.post(url, data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        return response.data.access_token;
    } catch (error) {
        console.error("Error fetching IAM token:", error.response ? error.response.data : error.message);
        return null;
    }
}

// --- IBM WATSONX.AI SERVICE ---
async function getAIResponse(userMessage) {
    const iamToken = await getIAMToken(process.env.WATSONX_API_KEY);
    if (!iamToken) return "Sorry, I couldn't authenticate with IBM Cloud for text generation.";

    const watsonx_url = 'https://us-south.ml.cloud.ibm.com/ml/v1-beta/generation/text?version=2024-03-19';
    const project_id = process.env.WATSONX_PROJECT_ID;
    const payload = {
        model_id: "ibm/granite-13b-instruct-v2",
        input: `You are the "PauraX Guide"...`, // Your full, detailed context prompt
        parameters: { max_new_tokens: 100 },
        project_id: project_id,
    };
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${iamToken}` };
    try {
        const response = await axios.post(watsonx_url, payload, { headers });
        return response.data.results[0].generated_text.trim();
    } catch (error) {
        console.error("Error calling watsonx.ai API:", error.response ? error.response.data : error.message);
        return "Sorry, I'm having trouble thinking right now.";
    }
}

// --- MOCK VISUAL RECOGNITION ---
async function analyzeImageMock(imageUrl) {
    console.log(`Simulating analysis for image URL: ${imageUrl}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
    const detectedObjects = ["pothole", "road", "asphalt"];
    console.log("Mock analysis complete. Detected:", detectedObjects);

    // Return an object with both a message and the specific issue type
    if (detectedObjects.includes("pothole")) {
        return {
            message: "Thank you for highlighting this! I've identified a *pothole* that needs repair.",
            issueType: "Pothole"
        };
    } else {
        return {
            message: `Thank you... I've detected: ${detectedObjects.join(', ')}.`,
            issueType: "General Issue"
        };
    }
}

// --- DATABASE & TWILIO FUNCTIONS ---
async function saveIssueToDB(issueType, location) {
    try {
        const dbRaw = fs.readFileSync(dbPath, 'utf-8');
        const dbData = JSON.parse(dbRaw);
        const newIssue = {
            id: Date.now(),
            type: issueType,
            location: location,
            timestamp: new Date().toISOString()
        };
        dbData.issues.push(newIssue);
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
        console.log("Successfully saved new issue to db.json:", newIssue);
    } catch (error) {
        console.error("Error saving to db.json:", error);
    }
}

async function sendWhatsAppMessage(to, message) {
    try {
        await twilioClient.messages.create({ body: message, from: twilioNumber, to: to });
        console.log(`Successfully sent message to ${to}`);
    } catch (error) {
        console.error(`Failed to send message to ${to}:`, error);
    }
}

// --- THE COMPLETE WEBHOOK LOGIC ---
app.post('/webhook', async (req, res) => {
    const userNumber = req.body.From;
    const userMessage = (req.body.Body || '').toLowerCase();
    
    // --- State Management: Check if we are waiting for a pin code ---
    if (userState[userNumber] && userState[userNumber].awaiting === 'pincode') {
        const location = req.body.Body; // The user's reply is the location
        const issueType = userState[userNumber].issueType;
        
        await saveIssueToDB(issueType, location);
        await sendWhatsAppMessage(userNumber, `Got it. Your report for the *${issueType}* issue in *${location}* has been logged. Thank you for being an active citizen!`);
        
        delete userState[userNumber]; // Clear the user's state
        res.status(200).send('<Response/>');
        return;
    }

    // --- Standard Message Handling ---
    if (req.body.NumMedia > 0) {
        const imageUrl = req.body.MediaUrl0;
        const analysis = await analyzeImageMock(imageUrl);
        
        // Send the analysis first
        await sendWhatsAppMessage(userNumber, analysis.message);
        
        // THEN, ask for the location and set the user's state in memory
        await sendWhatsAppMessage(userNumber, "To categorize this issue, could you please reply with your current pin code or neighborhood name?");
        userState[userNumber] = { awaiting: 'pincode', issueType: analysis.issueType };

    } else if (['hi', 'hello', 'menu'].includes(userMessage)) {
        await sendWhatsAppMessage(userNumber, "Welcome to PauraX! How can I help you today? Reply with a number to get started:\n\n1. See top community issues\n2. Learn how to submit a photo of an issue\n\nOr just ask me any question!");
    } else if (['issues', 'top', '1'].some(keyword => userMessage.includes(keyword))) {
        await sendWhatsAppMessage(userNumber, "My AI has analyzed all recent citizen reports. This week's top 3 issues have been ranked and are now open for investment:\n1. Pothole repairs on 2nd Ave\n2. Better lighting in City Park\n3. Waste management near the market.");
    } else {
        const aiResponse = await getAIResponse(req.body.Body);
        await sendWhatsAppMessage(userNumber, aiResponse);
    }

    res.status(200).send('<Response/>');
});

app.listen(PORT, () => {
    console.log(`PauraX server is running and listening on http://localhost:${PORT}`);
});