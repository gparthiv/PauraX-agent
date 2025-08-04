const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- NEW Function to get a temporary IAM Access Token ---
async function getIAMToken() {
  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) {
    console.error("ERROR: WATSONX_API_KEY not found in .env file.");
    return null;
  }

  const url = 'https://iam.cloud.ibm.com/identity/token';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  };
  const data = `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`;

  try {
    const response = await axios.post(url, data, { headers });
    return response.data.access_token; // Return the access token
  } catch (error) {
    console.error("Error fetching IAM token:", error.response ? error.response.data : error.message);
    return null;
  }
}

// --- UPDATED Function to get a response from watsonx.ai ---
async function getAIResponse(userMessage) {
  console.log("Getting IAM token...");
  const iamToken = await getIAMToken(); // First, get the temporary token

  if (!iamToken) {
    return "Sorry, I couldn't authenticate with IBM Cloud right now.";
  }
  console.log("Successfully got IAM token.");

  const watsonx_url = 'https://us-south.ml.cloud.ibm.com/ml/v1-beta/generation/text?version=2024-03-19';
  const project_id = process.env.WATSONX_PROJECT_ID;

  const payload = {
    model_id: "ibm/granite-13b-instruct-v2",
    input: `You are a helpful assistant for PauraX, a civic engagement platform. Respond concisely and helpfully. User asks: ${userMessage}`,
    parameters: {
      decoding_method: "greedy",
      max_new_tokens: 100,
      min_new_tokens: 10,
    },
    project_id: project_id,
  };

  // Use the new IAM Access Token for Authorization
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${iamToken}`
  };

  try {
    console.log("Sending request to watsonx.ai...");
    const response = await axios.post(watsonx_url, payload, { headers });
    const aiResponse = response.data.results[0].generated_text;
    return aiResponse;
  } catch (error) {
    console.error("Error calling watsonx.ai API:", error.response ? error.response.data : error.message);
    return "Sorry, I'm having trouble thinking right now.";
  }
}

// --- Webhook Endpoint (No changes here) ---
app.post('/webhook', async (req, res) => {
  const userMessage = req.body.Body;
  const userNumber = req.body.From;
  console.log(`Webhook received! Message from ${userNumber}:`, userMessage);

  const aiResponse = await getAIResponse(userMessage);
  console.log("Response from watsonx.ai:", aiResponse);

  res.send('<Response></Response>');
});

app.listen(PORT, () => {
  console.log(`PauraX server is running and listening on http://localhost:${PORT}`);
});