# Aura AI Sales Assistant 🚀

Welcome to **Aura**, an elite AI-powered Sales Assistant and Automation Bot designed to supercharge your business growth. Aura uses advanced Gemini AI models to qualify leads, analyze uploaded documents and images, and help you close deals faster.

## ✨ Key Features
- **Smart Chat & Lead Scoring:** Qualifies leads as **HOT**, **WARM**, or **COLD** dynamically based on user interaction.
- **Document & Image Analysis:** Natively processes and extracts insights from uploaded PDFs and images.
- **Action-Oriented Engagement:** Triggers CTA (Call To Action) prompts exactly when the buyer is ready.
- **Modern & Premium UI:** Beautiful, light-mode, ChatGPT-like chat interface optimized for responsiveness and user experience.

---

## 🛠️ Technology Stack
- **Backend:** Node.js, Express, Multer (for file handling)
- **AI Core:** Google Generative AI (Gemini 1.5 Flash)
- **Frontend:** Vanilla HTML5, Vanilla CSS3, Javascript
- **Deployment:** Optimized for Vercel

---

## 🚀 Getting Started

Follow these steps to run Aura AI Sales Assistant locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v18 or higher recommended).
- A **Gemini AI API Key** from Google AI Studio.

### Installation

1. **Open your terminal** and navigate into the `ai-sales-bot` folder:
   ```powershell
   cd ai-sales-bot
   ```

2. **Install the dependencies:**
   ```powershell
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or update the existing one) and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3001
   ```

4. **Run the server:**
   ```powershell
   npm run dev
   ```

5. **Open the App:**
   Visit [http://localhost:3001](http://localhost:3001) in your browser to view and test your Sales Bot!

---

## 📂 Project Structure

```text
ai-sales-bot/
├── api/                # Vercel Serverless Functions
│   ├── chat.js
│   └── upload.js
├── public/             # Static Assets & Frontend
│   ├── index.html
│   ├── script.js
│   └── style.css
├── server.js           # Local Express Backend
├── .env                # Environment Variables (ignored by Git)
├── package.json        # Dependencies & Scripts
└── vercel.json         # Vercel Deployment Configuration
```

---

## 📄 License

This project is open-source and available under the [ISC License](LICENSE).
