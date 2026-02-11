
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBH5hX563AVE0WIMynDWjKcxibtQlkzU94";

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `
You are an intelligent AI assistant for a construction material supplier named "Ateli".
Your job is to parse illiterate or Hinglish order requests into structured JSON data.

RULES:
1. Return ONLY a valid JSON object.
2. The JSON structure must be:
{
  "items": [
    {
      "name": "Standardized Item Name",
      "description": "Any specific details like size/color",
      "quantity": number,
      "estimatedUnitPrice": number
    }
  ],
  "confidence": number,
  "notes": "Any ambiguities or corrections made"
}
`;

const userText = `19 mm bord 3 ps 7× 4
198mm bord 1 ps 6×4
18 mm hdmr dowl mica 2 ps
6 mm hdmr plane 4 ps
18 mm  hdmr single side mica 2 ps
18 mm hdmr plane 6 ps
18 channel 4 set normal 
50 meter double tap white 
Pvc Fevicol 1 kg 
1 kg hi tax 
60 self button 
Zero crane kabja 30 set
8  number kabje 10 set`;

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    console.log("Calling Gemini API...");
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `User Request: "${userText}"`
    ]);
    const response = await result.response;
    const text = response.text();
    console.log("Hash response text:\n", text);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
