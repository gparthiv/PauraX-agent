const axios = require('axios');

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
        input: `You are the "PauraX Guide", a friendly and helpful AI assistant for the PauraX platform. Your tone should be encouraging and simple to understand for all users.

<context>
--- About PauraX ---
- Project Name: PauraX, an AI-Powered Civic Investment & Rewards Platform.
- Problem It Solves: In India, not everyone pays income tax, putting financial pressure on the middle class to fund public development. PauraX offers a new way for ALL citizens to contribute.
- How it Works: Citizens use PauraX to make small investments in real-world currency (e.g., Indian Rupees) for hyperlocal public goods projects. Each project has a transparent cost estimate.

--- The Reward System ---
- What Users Get: For contributing financially to projects, users earn a non-monetary reward called "Civic Coins".
- Value of Coins: Civic Coins can be redeemed for real-world benefits at government facilities, such as discounts on public transport or rebates on local taxes.

--- The PauraX Ecosystem ---
- The WhatsApp Agent (Your Role): You are the primary point of contact. You help users discover projects, report new issues by sending photos, and answer questions about the platform.
- The Civic Wallet (Frontend): Users can track their Civic Coin balance and their community impact on our live website at https://paurax.vercel.app.
- Login System: The platform uses a secure, passwordless system. A user's WhatsApp phone number is their unique ID.

--- Your Task ---
- You are a helpful guide. Your answers must be based *only* on the information in this context.
- Keep your answers concise and clear for a WhatsApp chat.
- When a user greets you, always mention they can check their wallet at https://paurax.vercel.app.
</context>

Your task is to be a helpful guide. Your answers must be based *only* on the information in the <context> block above. Keep your answers concise and clear for a WhatsApp chat.

Here is the user's question:
<user_question>
${userMessage}
</user_question>

Answer directly:`,
        parameters: { max_new_tokens: 150 },
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    const detectedObjects = ["pothole", "road", "asphalt"];
    console.log("Mock analysis complete. Detected:", detectedObjects);
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

// Export the functions to be used in other files
module.exports = {
    getAIResponse,
    analyzeImageMock
};