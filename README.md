# 🤖 PauraX Agent Backend

The official backend service for **PauraX** — an **AI-powered civic investment and rewards platform** built for the **IBM TechXchange 2025 Pre-conference watsonx Hackathon**.

📱 Powers the **WhatsApp AI Agent**, enabling conversational civic engagement with **IBM watsonx**.  
🔗 **Live Frontend Demo →** [paurax.vercel.app](https://paurax.vercel.app)

---

## 💡 About the Name: *PauraX*

- **Paur (पौर)** → A Sanskrit word meaning *citizen* or *urbanite*, reflecting our mission to empower the people of the city.  
- **X** → Inspired by **IBM watsonx**, representing the *exponential power of AI* in civic engagement.  

---

## 🎯 The Problem

In India, the **tax base for public development is narrow**, placing disproportionate pressure on the **middle class**.  
**PauraX** addresses this by enabling *all citizens* to **invest in hyperlocal public goods** (e.g., park benches, solar lights).

💰 In return for real-currency contributions, users receive **non-monetary Civic Coins** → fostering **civic pride, transparency, and decentralized community improvement**.

---

## ✨ The Solution

PauraX consists of:

- 📱 **WhatsApp AI Agent (this repo)** → Conversational interface for reporting issues, funding projects, and earning Civic Coins.  
- 💳 **Civic Wallet (frontend)** → A visual dashboard to track contributions and impact.  

This backend integrates **IBM watsonx.ai + Granite foundation models** to understand user queries, analyze photos, and guide contributions.

---

## 🚀 Core Features

- 💬 **Conversational AI**  
  Powered by **IBM Granite Instruct v2** on watsonx.ai → contextual chats about projects & rewards.

- 📸 **Photo-based Issue Reporting**  
  Upload a civic issue photo → the agent simulates AI-powered issue detection & logging.

- 📍 **Personalized Suggestions**  
  Requests user location → returns nearby civic projects for investment.

- 💰 **Simulated Investment Flow**  
  Multi-step WhatsApp chat → select project → contribute in ₹ → get estimated Civic Coins.

- 🔄 **Stateful Conversations**  
  Tracks user journey across multiple steps *(report → location → funding)*.

- 🗄️ **Mock Database**  
  Issues stored in `db.json` → simulating persistence for the hackathon prototype.

---

## 🛠️ Tech Stack

- ☁️ **AI Platform** → IBM watsonx.ai  
- 🧠 **Foundation Model** → IBM Granite Instruct v2  
- ⚡ **Runtime** → Node.js + Express.js  
- 📲 **Messaging API** → Twilio (WhatsApp Sandbox)  
- 📦 **Core Libraries** → axios, dotenv, twilio  

---

## ⚙️ Setup & Usage

### ✅ Prerequisites
- Node.js (v18+)  
- IBM Cloud account (watsonx.ai credentials)  
- Twilio account with WhatsApp Sandbox enabled  

### 🔧 Installation
```bash
# Clone the repository
git clone https://github.com/your-username/PauraX-agent.git
cd PauraX-agent

# Install dependencies
npm install
```

## FrontEnd Repo: https://github.com/gparthiv/paurax-frontend
