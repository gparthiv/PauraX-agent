const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse incoming request bodies
// This is crucial for receiving data from Twilio
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage route (for testing in browser)
app.get('/', (req, res) => {
  res.send('Hello World! Your PauraX server is running.');
});

// THIS IS OUR NEW WEBHOOK ENDPOINT
// Twilio will send POST requests to this URL
app.post('/webhook', (req, res) => {
  console.log('Webhook received!');
  console.log('Message from user:', req.body.Body); // Logs the user's message
  console.log('From number:', req.body.From); // Logs the user's phone number

  // We'll add our AI logic here later.
  // For now, just send a simple confirmation back to Twilio.
  res.send('<Response></Response>'); 
});

// Start the server
app.listen(PORT, () => {
  console.log(`PauraX server is running and listening on http://localhost:${PORT}`);
});