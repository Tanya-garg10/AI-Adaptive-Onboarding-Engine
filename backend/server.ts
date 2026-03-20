import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Multer setup for file uploads
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });

  // API route for PDF text extraction
  app.post("/api/extract-text", upload.single("resume"), async (req, res) => {
    console.log("Received extract-text request");
    try {
      if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      console.log("Parsing PDF, buffer size:", req.file.buffer.length);
      const parser = new PDFParse({ data: req.file.buffer });
      const result = await parser.getText();
      
      if (!result.text || result.text.trim().length === 0) {
        console.log("Extraction failed: empty text");
        return res.status(400).json({ error: "Could not extract text from PDF" });
      }

      console.log("Extraction successful, text length:", result.text.length);
      res.json({ text: result.text });
    } catch (error) {
      console.error("PDF extraction error:", error);
      res.status(500).json({ error: "Failed to extract text from PDF" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.resolve(__dirname, "../frontend"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
