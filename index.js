const express = require('express');
require('dotenv').config();

// Import our new service modules
const watsonxService = require('./services/watsonx.service');
const twilioService = require('./services/twilio.service');
const dbService = require('./services/db.service');

const app = express();
const PORT = 3000;

// Simple in-memory "short-term memory" to track conversations
const userState = {};

const mainMenuMessage = "Welcome to PauraX! How can I help you today?\n\n1. See top community issues\n2. Learn how to submit an issue\n\nTo see your Civic Coin balance and project impact, visit your personal wallet at:\nhttps://paurax.vercel.app";
const topIssuesMessage = "Here are the top community issues you can support:\n\n1. Pothole repairs on 2nd Ave\n(Est. Cost: *₹8,000*\nReward: *500* Civic Coins)\n2. Better lighting in City Park\n(Est. Cost: *₹20,000*\nReward: *1200* Civic Coins)\n3. Waste management near the market\n(Est. Cost: *₹15,000*\nReward: *800* Civic Coins)\n\nTo invest, reply with 'invest' and the number (e.g., *invest 1*).\n\nType /back to return to the main menu.";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- THE WEBHOOK LOGIC ---
app.post('/webhook', async (req, res) => {
    const userNumber = req.body.From;
    const userMessage = (req.body.Body || '').toLowerCase().trim();
    
    // Universal "back" command
    if (userMessage === '/back') {
        delete userState[userNumber];
        await twilioService.sendWhatsAppMessage(userNumber, mainMenuMessage);
        res.status(200).send('<Response/>');
        return;
    }

    // State Management Logic
    if (userState[userNumber]) {
        const state = userState[userNumber];
        if (state.awaiting === 'pincode') {
            const location = req.body.Body;
            await dbService.saveIssueToDB(state.issueType, location);
            await twilioService.sendWhatsAppMessage(userNumber, `Got it. Your report for the *${state.issueType}* issue in *${location}* has been logged. Thank you!`);
            // NEW: Add a follow-up message to guide the user
            await twilioService.sendWhatsAppMessage(userNumber, "You can now type `/back` to return to the main menu or ask another question.");
            delete userState[userNumber];
        } else if (state.awaiting === 'location_for_issues') {
            await twilioService.sendWhatsAppMessage(userNumber, `Thank you. Here are the top issues reported in the *${req.body.Body}* area:`);
            await twilioService.sendWhatsAppMessage(userNumber, topIssuesMessage);
            userState[userNumber] = { awaiting: 'investment_confirmation' };
        } else if (state.awaiting === 'investment_confirmation') {
            const projectNumber = parseInt(userMessage.replace('invest', '').trim());
            if (projectNumber >= 1 && projectNumber <= 3) {
                const projects = [
                    { name: "Pothole repairs on 2nd Ave", cost: 8000, coins: 500 },
                    { name: "Better lighting in City Park", cost: 20000, coins: 1200 },
                    { name: "Waste management near the market", cost: 15000, coins: 800 }
                ];
                const selectedProject = projects[projectNumber - 1];
                userState[userNumber] = { awaiting: 'contribution_amount', project: selectedProject };
                await twilioService.sendWhatsAppMessage(userNumber, `You've selected: *${selectedProject.name}*. How much would you like to contribute in Rupees (₹)?`);
            } else {
                await twilioService.sendWhatsAppMessage(userNumber, "Invalid selection. Please type 'invest 1', 'invest 2', or 'invest 3'.\n\nType /back to return to the main menu.");
            }
        } else if (state.awaiting === 'contribution_amount') {
            const contribution = parseFloat(userMessage);
            const project = state.project;
            if (!isNaN(contribution) && contribution > 0) {
                const rewardedCoins = Math.floor((contribution / project.cost) * project.coins);
                const paymentMessage = `Thank you for your contribution of *₹${contribution}*! You will be rewarded with *${rewardedCoins} Civic Coins*.\n\nTo complete your investment, please click this secure link:\nhttps://paurax.com/pay/demo123\n(This is a demo link).\n\nType /back to return to the main menu.`;
                await twilioService.sendWhatsAppMessage(userNumber, paymentMessage);
                delete userState[userNumber];
            } else {
                await twilioService.sendWhatsAppMessage(userNumber, "Please enter a valid number for your contribution amount.");
            }
        }
        res.status(200).send('<Response/>');
        return;
    }

    // Standard Message Handling
    if (req.body.NumMedia > 0) {
        const imageUrl = req.body.MediaUrl0;
        const analysis = await watsonxService.analyzeImageMock(imageUrl);
        await twilioService.sendWhatsAppMessage(userNumber, analysis.message);
        await twilioService.sendWhatsAppMessage(userNumber, "To categorize this issue, could you please reply with your current pin code or neighborhood name?");
        userState[userNumber] = { awaiting: 'pincode', issueType: analysis.issueType };
    } else if (['hi', 'hello', 'menu'].includes(userMessage)) {
        await twilioService.sendWhatsAppMessage(userNumber, mainMenuMessage);
    } else if (userMessage === '1' || userMessage.includes('issues')) {
        await twilioService.sendWhatsAppMessage(userNumber, "To find the top issues near you, please reply with your pin code or neighborhood name.");
        userState[userNumber] = { awaiting: 'location_for_issues' };
    } else if (userMessage === '2') {
        await twilioService.sendWhatsAppMessage(userNumber, "To submit an issue, simply send a clear photo of the problem (like a pothole or broken street light). I will analyze it and guide you through the next steps!");
    } else {
        const aiResponse = await watsonxService.getAIResponse(req.body.Body);
        await twilioService.sendWhatsAppMessage(userNumber, aiResponse);
    }

    res.status(200).send('<Response/>');
});

app.listen(PORT, () => {
    console.log(`PauraX server is running and listening on http://localhost:${PORT}`);
});