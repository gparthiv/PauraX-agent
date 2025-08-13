PauraX Agent Backend
The official backend service for PauraX, an AI-powered civic investment and rewards platform built for the IBM TechXchange 2025 Pre-conference watsonx Hackathon.

➡️ Live Frontend Demo: https://paurax.vercel.app

💡 About the Name: PauraX
The name 'PauraX' is a fusion of two concepts. 'Paur' (पौर) is a Sanskrit word meaning 'citizen' or 'urbanite,' reflecting our mission to empower the people of the city. The 'X' is inspired by IBM watsonx, representing the exponential power of AI to amplify and accelerate this civic engagement.

🎯 The Problem
In India, the tax base for public development is narrow, placing disproportionate pressure on the middle class. PauraX addresses this by allowing all citizens to invest in hyperlocal public goods (e.g., park benches, solar lights). In return for real-currency contributions, users receive non-monetary "Civic Coins," encouraging civic pride and decentralizing community improvement with full transparency.

✨ The Solution
PauraX consists of a WhatsApp AI Agent and a web-based Civic Wallet. This repository contains the backend code for the agent, which acts as the core intelligence. Leveraging IBM watsonx.ai and Granite foundation models, the agent understands user queries, provides project information, and guides users through issue reporting and contributions via the highly accessible WhatsApp interface.

🚀 Core Features
Conversational AI: Utilizes IBM's Granite Instruct v2 model on watsonx.ai for rich, contextual conversations about projects and the Civic Coin reward system.

Intelligent Issue Reporting via Photo: Users can send a photo of a civic issue. The agent performs a simulated analysis (designed for IBM's vision models) to identify and log the problem.

Personalized, Location-Based Suggestions: Asks for the user's location to simulate how IBM watsonx.ai can provide a personalized list of nearby projects.

Simulated Investment Flow: A complete, multi-step conversational flow for users to select a project, specify a contribution amount (₹), and receive a proportional Civic Coin reward estimate.

Stateful Conversations: An in-memory state machine tracks the user's journey, allowing for multi-step interactions like reporting an issue and then providing a location.

Mock Database: Persists user-reported issues to a db.json file to simulate a real database for the hackathon prototype.

🛠️ Tech Stack
AI Platform: IBM watsonx.ai

Foundation Model: IBM Granite Instruct v2

Runtime: Node.js & Express.js

Messaging API: Twilio for WhatsApp

Core Libraries: axios, dotenv, twilio

⚙️ Setup and Usage
Prerequisites
Node.js (v18+)

An IBM Cloud account with watsonx.ai credentials

A Twilio account with a configured WhatsApp Sandbox

Installation & Running
Clone the repository and install dependencies:

git clone https://github.com/your-username/PauraX-agent.git
cd PauraX-agent
npm install

Create a .env file and add your API keys.

Start the server:

node index.js

Expose the server to the internet using ngrok http 3000 and update the webhook URL in your Twilio Sandbox settings.

🌐 Frontend Repository
The code for the React-based Civic Wallet can be found here: https://github.com/gparthiv/paurax-frontend