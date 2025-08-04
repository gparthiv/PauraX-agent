const express = require('express');
const axios = require('axios');
require('dotenv').config();
const twilio = require('twilio');

// All the code above this point (imports, initializations, helper functions) remains the same.
// I'm omitting it here for brevity, but leave it in your file.
const app = express();
const PORT = 3000;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);
const twilioNumber = 'whatsapp:+14155238886';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

async function getAIResponse(userMessage) {
  const iamToken = await getIAMToken();
  if (!iamToken) return "Sorry, I couldn't authenticate with IBM Cloud right now.";

  const watsonx_url = 'https://us-south.ml.cloud.ibm.com/ml/v1-beta/generation/text?version=2024-03-19';
  const project_id = process.env.WATSONX_PROJECT_ID;
  const payload = {
    model_id: "ibm/granite-13b-instruct-v2",
    input: `You are the "PauraX Guide", a friendly and helpful AI assistant for the PauraX platform. Your tone should be encouraging and simple to understand for all users.

<context>
--- About PauraX ---
- Project Name: PauraX, an AI-Powered Civic Investment & Rewards Platform.
- Problem It Solves: In India, not everyone pays income tax, putting financial pressure on the middle class to fund public development. PauraX offers a new way for ALL citizens to contribute.
- How it Works: Citizens use PauraX to make small investments in hyperlocal public goods projects (e.g., new park benches, solar lights, small community parks).
- The Goal: To encourage civic pride, increase transparency, and decentralize participation in public development.

--- The Reward System ---
- What Users Get: For contributing to projects, users earn a non-monetary reward called "Civic Coins".
- Value of Coins: Civic Coins can be redeemed for real-world benefits at government facilities, such as discounts on public transport or rebates on local taxes.
- The Wallet: Users can track their Civic Coin balance, their community impact score, and browse projects on a Web Dashboard Wallet.

--- Your Role as the AI Agent ---
- Your main function is to help users through a WhatsApp chat.
- You can help users discover local projects they can invest in.
- You can answer questions about how PauraX works, about Civic Coins, and about the impact of projects.
- You should provide civic education and gentle "nudges" to encourage participation.
</context>

Your task is to be a helpful guide. Your answers must be based *only* on the information in the <context> block above. Keep your answers concise and clear for a WhatsApp chat.

Here is the user's question:
<user_question>
${userMessage}
</user_question>

Answer directly:`, parameters: { max_new_tokens: 100 },
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


// --- UPDATED Webhook Endpoint with Hybrid Logic ---
app.post('/webhook', async (req, res) => {
  const userNumber = req.body.From;
  const userMessage = (req.body.Body || '').toLowerCase(); // Standardize to lowercase
  let responseMessage;

  // --- Guided Path (Menu System) ---
  const greetings = ['hi', 'hello', 'menu', 'start'];
  // Check for keywords for our "top issues" feature
  const topIssuesKeywords = ['issues', 'top', '1'];

  if (req.body.NumMedia > 0) {
    console.log(`Image received from ${userNumber}`);
    responseMessage = "Thank you for submitting a photo! I've analyzed the image and identified a potential civic issue. A new micro-investment project is being created and citizens in the area will be notified shortly.";
  }
  else if (greetings.includes(userMessage)) {
    console.log(`Greeting received from ${userNumber}`);
    responseMessage = "Welcome to PauraX! How can I help you today? Reply with a number to get started:\n\n1. See top community issues\n2. Learn how to submit a photo of an issue\n\nOr just ask me any question!";
  }
  else if (topIssuesKeywords.some(keyword => userMessage.includes(keyword))) {
    console.log(`Top issues request received from ${userNumber}`);
    responseMessage = "My AI has analyzed all recent citizen reports. This week's top 3 issues have been ranked and are now open for investment:\n1. Pothole repairs on 2nd Ave\n2. Better lighting in City Park\n3. Waste management near the market.";
  }
  // --- NLP Path (AI Brain) ---
  else {
    console.log(`NLP Request from ${userNumber}:`, req.body.Body);
    responseMessage = await getAIResponse(req.body.Body);
    console.log("Response from watsonx.ai:", responseMessage);
  }

  // Send the appropriate response back to the user
  await sendWhatsAppMessage(userNumber, responseMessage);

  res.status(200).send('<Response/>');
});


app.listen(PORT, () => {
  console.log(`PauraX server is running and listening on http://localhost:${PORT}`);
});