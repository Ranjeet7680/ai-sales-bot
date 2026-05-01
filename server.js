const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// In-memory file uploads (no disk, no path issues)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

app.use(express.static(path.join(__dirname, "public")));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: `You are Aura, an elite AI Sales Assistant. You qualify leads, analyze documents, and close deals.
ALWAYS return ONLY raw JSON (no markdown, no backticks). Example format:
{"reply": "your message here", "action": null, "leadScore": "WARM"}
For leadScore use: "HOT" (ready to buy), "WARM" (interested/asking), "COLD" (confused/hesitant)
For action use: "SHOW_CTA" only if user is ready to buy, otherwise null`
});

// Separate model for document analysis (no system instruction restriction)
const docModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const sessions = {};

// ─── 1. Text Chat Endpoint ───────────────────────────────────────────
app.post("/chat", async (req, res) => {
  const { sessionId = "demo_session", message } = req.body;
  
  if (!sessions[sessionId]) {
    sessions[sessionId] = { 
      history: [
        { role: "user", parts: [{ text: "Hello" }] },
        { role: "model", parts: [{ text: '{"reply": "Hi there! 👋 I\'m Aura. How can I help you scale your business today?", "action": null, "leadScore": "COLD"}' }] }
      ] 
    };
  }

  try {
    const chat = chatModel.startChat({ history: sessions[sessionId].history });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text().trim();
    
    let parsedResponse;
    try {
      const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch(e) {
      // If JSON parse fails, wrap raw text
      parsedResponse = { reply: responseText, action: null, leadScore: "WARM" };
    }

    sessions[sessionId].history.push({ role: "user", parts: [{ text: message }] });
    sessions[sessionId].history.push({ role: "model", parts: [{ text: JSON.stringify(parsedResponse) }] });

    res.json(parsedResponse);
  } catch (error) {
    console.error("Chat Error:", error.message);
    res.json({ reply: "Sorry, I ran into an issue. Please try again!", action: null, leadScore: "COLD" });
  }
});

// ─── 2. File Upload Endpoint (PDF & Images via Gemini Native) ───────
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("=== UPLOAD HIT ===");
  const { sessionId = "demo_session" } = req.body;
  const file = req.file;

  if (!file) {
    console.log("No file received.");
    return res.status(400).json({ reply: "No file received by server.", action: null, leadScore: "COLD" });
  }

  console.log(`Received: ${file.originalname} | Type: ${file.mimetype} | Size: ${(file.size/1024).toFixed(1)} KB`);

  if (!sessions[sessionId]) {
    sessions[sessionId] = { history: [] };
  }

  try {
    let result;
    const base64Data = file.buffer.toString("base64");
    const filePart = { inlineData: { data: base64Data, mimeType: file.mimetype } };

    if (file.mimetype === "application/pdf") {
      // Gemini natively reads PDFs — no pdf-parse needed!
      const prompt = `You received a PDF document. 
Please read the entire document carefully and provide:
1. A one-line title/description of what this document is about
2. Exactly 5 bullet points summarizing key insights
3. How a salesperson could use this information to pitch a product or service

Return ONLY raw JSON in this exact format (no markdown):
{"reply": "📄 **Document Analysis Complete!**\\n\\n[Your 5 bullet summary here with emojis]\\n\\n💡 **Sales Angle:** [sales pitch angle]", "action": null, "leadScore": "WARM"}`;
      
      result = await docModel.generateContent([prompt, filePart]);

    } else if (file.mimetype.startsWith("image/")) {
      const prompt = `You received an image. Read any visible text and analyze what the image shows.
Return ONLY raw JSON in this exact format (no markdown):
{"reply": "🖼️ **Image Analysis Complete!**\\n\\n[Describe what you see and any text found]\\n\\n💡 **Insight:** [business/sales insight]", "action": null, "leadScore": "WARM"}`;
      
      result = await docModel.generateContent([prompt, filePart]);

    } else {
      return res.json({ reply: "❌ Unsupported file type. Please upload a PDF or image.", action: null, leadScore: "COLD" });
    }

    const rawText = result.response.text().trim();
    console.log("AI Raw Response:", rawText.substring(0, 200));

    let parsedResponse;
    try {
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch(e) {
      // If JSON fails, just show the raw text cleanly
      parsedResponse = { reply: rawText, action: null, leadScore: "WARM" };
    }

    // Add to session memory
    sessions[sessionId].history.push({
      role: "user",
      parts: [{ text: `[User uploaded: ${file.originalname}]` }]
    });
    sessions[sessionId].history.push({
      role: "model",
      parts: [{ text: JSON.stringify(parsedResponse) }]
    });

    console.log("Success! Sending response.");
    res.json(parsedResponse);

  } catch (error) {
    console.error("=== UPLOAD ERROR ===", error.message);
    res.status(500).json({ 
      reply: `❌ AI Error: ${error.message}. Check your API key and try again.`, 
      action: null, 
      leadScore: "COLD" 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 AI Sales Bot READY → http://localhost:${PORT}`);
  console.log(`📋 API Key: ${process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ MISSING"}\n`);
});
