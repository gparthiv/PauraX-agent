const express = require('express');
const axios = require('axios');
require('dotenv').config();
const twilio = require('twilio'); // Import the new Twilio library

const app = express();
const PORT = 3000;

// --- Initialize Twilio Client ---
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);
const twilioNumber = 'whatsapp:+14155238886'; // Your Twilio Sandbox Number

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Function to get IAM Token (No changes here) ---
async function getIAMToken() {
  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) {
    console.error("ERROR: WATSONX_API_KEY not found in .env file.");
    return null;
  }
  const url = 'https://iam.cloud.ibm.com/identity/token';
  const data = `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`;
  try {
    const response = await axios.post(url, data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' } });
    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching IAM token:", error.response ? error.response.data : error.message);
    return null;
  }
}

// --- Function to get AI Response (No changes here) ---
async function getAIResponse(userMessage) {
  const iamToken = await getIAMToken();
  if (!iamToken) return "Sorry, I couldn't authenticate with IBM Cloud right now.";

  const watsonx_url = 'https://us-south.ml.cloud.ibm.com/ml/v1-beta/generation/text?version=2024-03-19';
  const project_id = process.env.WATSONX_PROJECT_ID;
  const payload = {
    model_id: "ibm/granite-13b-instruct-v2",
    input: `You are a helpful and creative assistant for PauraX, a civic engagement platform. Your goal is to help users find and support local community projects. Be friendly and concise. User asks: "${userMessage}"`,
    parameters: { max_new_tokens: 100 },
    project_id: project_id,
  };
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${iamToken}` };
  try {
    const response = await axios.post(watsonx_url, payload, { headers });
    return response.data.results[0].generated_text.trim(); // Using trim() to clean up the response
  } catch (error) {
    console.error("Error calling watsonx.ai API:", error.response ? error.response.data : error.message);
    return "Sorry, I'm having trouble thinking right now.";
  }
}

// --- NEW Function to send a WhatsApp message ---
async function sendWhatsAppMessage(to, message) {
  try {
    await client.messages.create({
      body: message,
      from: twilioNumber,
      to: to
    });
    console.log(`Successfully sent message to ${to}`);
  } catch (error) {
    console.error(`Failed to send message to ${to}:`, error);
  }
}

// --- UPDATED Webhook Endpoint ---
app.post('/webhook', async (req, res) => {
  const userMessage = req.body.Body;
  const userNumber = req.body.From;
  console.log(`Webhook received! Message from ${userNumber}:`, userMessage);

  const aiResponse = await getAIResponse(userMessage);
  console.log("Response from watsonx.ai:", aiResponse);

  // Use our new function to send the AI response back to the user
  await sendWhatsAppMessage(userNumber, aiResponse);

  // We still send an empty response back to Twilio's initial request
  res.status(200).send('<Response/>');
});

app.listen(PORT, () => {
  console.log(`PauraX server is running and listening on http://localhost:${PORT}`);
});