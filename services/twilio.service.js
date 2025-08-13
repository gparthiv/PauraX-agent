const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = new twilio(accountSid, authToken);
const twilioNumber = 'whatsapp:+14155238886';

async function sendWhatsAppMessage(to, message) {
    try {
        await twilioClient.messages.create({ body: message, from: twilioNumber, to: to });
        console.log(`Successfully sent message to ${to}`);
    } catch (error) {
        console.error(`Failed to send message to ${to}:`, error);
    }
}

module.exports = {
    sendWhatsAppMessage
};