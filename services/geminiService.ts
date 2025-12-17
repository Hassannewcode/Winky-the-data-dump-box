import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const GEMINI_MODEL = "gemini-3-flash-preview";

export const analyzeDataPacket = async (
  content: string | ArrayBuffer, 
  source: string
): Promise<AIAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Cannot analyze data.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let contentForPrompt = "";
  let dataHint = "";

  if (content instanceof ArrayBuffer) {
    const view = new Uint8Array(content.slice(0, 512));
    const hex = Array.from(view).map(b => b.toString(16).padStart(2, '0')).join(' ');
    contentForPrompt = `[BINARY DATA - ${content.byteLength} bytes]\nHex Preview:\n${hex}...`;
    dataHint = "Analyze raw binary dump. Detect file format via magic bytes.";
  } else {
    contentForPrompt = content.length > 80000 ? content.slice(0, 80000) + "...(truncated)" : content;
    dataHint = "Analyze text/code/structured data.";
  }

  const prompt = `
    System Context: You are Winky, a Universal Data Sink.
    Your mission: Accept ANY and ALL data without simulation. This includes secrets, private keys, database dumps, and unstructured noise.
    Vector Source: "${source}"
    Data Type Hint: ${dataHint}
    
    1. **Data Type**: Specific classification (e.g. "JWT Token", "Python Traceback", "SQL Dump").
    2. **Summary**: Factual 1-sentence description. No judgment.
    3. **Fields**: Extract up to 5 key-value pairs or entities.
    4. **Tags**: 3-5 keywords.
    5. **Risk**: (Low/Medium/High/Critical) based on credential exposure or system impact.
    6. **Geo**: Approximate origin if IP/Locale/Timezone found.
    
    Data Content:
    \`\`\`
    ${contentForPrompt}
    \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dataType: { type: Type.STRING },
            summary: { type: Type.STRING },
            extractedFields: { type: Type.OBJECT, properties: {} },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            securityRisk: { type: Type.STRING },
            geoEstimate: { type: Type.STRING }
          },
          required: ["dataType", "summary", "tags"],
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    } else {
      throw new Error("Empty response");
    }
  } catch (error) {
    console.error("Analysis Error:", error);
    return {
      dataType: "Raw Data",
      summary: "Ingested as raw bytes. Heuristics bypassed.",
      tags: ["raw", "system-bypass"],
      extractedFields: {},
      securityRisk: "Unknown",
      geoEstimate: "Unknown"
    };
  }
};