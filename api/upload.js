const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const docModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Use memory storage for Vercel (no disk access)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Vercel doesn't support multer middleware directly, so we use a helper
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });

  try {
    // Run multer to parse multipart form data
    await runMiddleware(req, res, upload.single("file"));

    const file = req.file;

    if (!file) {
      return res.status(400).json({ reply: "❌ No file received.", action: null, leadScore: "COLD" });
    }

    console.log(`File: ${file.originalname} | Type: ${file.mimetype} | Size: ${(file.size / 1024).toFixed(1)} KB`);

    const base64Data = file.buffer.toString("base64");
    const filePart = { inlineData: { data: base64Data, mimeType: file.mimetype } };

    let prompt = "";

    if (file.mimetype === "application/pdf") {
      prompt = `You received a PDF document. Read it and provide:
1. What this document is about (one line)
2. Exactly 5 bullet points summarizing key insights
3. A sales angle — how can this be used to pitch a product/service?

Return ONLY raw JSON (no markdown):
{"reply": "📄 **Document Analysis!**\\n\\n• Point 1\\n• Point 2\\n• Point 3\\n• Point 4\\n• Point 5\\n\\n💡 **Sales Angle:** ...", "action": null, "leadScore": "WARM"}`;

    } else if (file.mimetype.startsWith("image/")) {
      prompt = `You received an image. Read any text visible and analyze what it shows. Provide a business insight.

Return ONLY raw JSON (no markdown):
{"reply": "🖼️ **Image Analysis!**\\n\\n[Describe what you see]\\n\\n💡 **Insight:** ...", "action": null, "leadScore": "WARM"}`;

    } else {
      return res.json({ reply: "❌ Unsupported file. Upload a PDF or Image.", action: null, leadScore: "COLD" });
    }

    const result = await docModel.generateContent([prompt, filePart]);
    const rawText = result.response.text().trim();

    let parsedResponse;
    try {
      const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (e) {
      parsedResponse = { reply: rawText, action: null, leadScore: "WARM" };
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error("Upload Error:", error.message);
    res.status(500).json({ reply: `❌ Error: ${error.message}`, action: null, leadScore: "COLD" });
  }
};
