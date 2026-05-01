const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: `You are Aura, an elite AI Sales Assistant. You qualify leads, analyze documents, and close deals.
ALWAYS return ONLY raw JSON (no markdown, no backticks). Example format:
{"reply": "your message here", "action": null, "leadScore": "WARM"}
For leadScore use: "HOT" (ready to buy), "WARM" (interested/asking), "COLD" (confused/hesitant)
For action use: "SHOW_CTA" only if user is ready to buy, otherwise null`
});

// In-memory sessions (resets on cold start — fine for hackathon demo)
const sessions = {};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });

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
      const cleanJson = responseText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (e) {
      parsedResponse = { reply: responseText, action: null, leadScore: "WARM" };
    }

    sessions[sessionId].history.push({ role: "user", parts: [{ text: message }] });
    sessions[sessionId].history.push({ role: "model", parts: [{ text: JSON.stringify(parsedResponse) }] });

    res.json(parsedResponse);
  } catch (error) {
    console.error("Chat Error:", error.message);
    res.json({ reply: "Sorry, I ran into an issue. Please try again!", action: null, leadScore: "COLD" });
  }
};
