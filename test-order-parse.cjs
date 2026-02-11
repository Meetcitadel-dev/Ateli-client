const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyBH5hX563AVE0WIMynDWjKcxibtQlkzU94";
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `
You are an intelligent AI assistant for a construction material supplier named "Ateli".
Your job is to parse illiterate or Hinglish order requests into structured JSON data.

RULES:
1. Identify the items, quantities, and specific descriptions (like dimensions "7x4" or "white").
2. Map Hinglish terms to proper English (e.g., "kabja" -> "Hinge", "bord" -> "Board", "fevicol" -> "Adhesive").
3. If a specific dimension like "198mm" seems like a typo for "19mm", correct it based on context.
4. Return ONLY a valid JSON object. Do not include any conversational text, markdown formatting, or code blocks.
5. The JSON structure must be:
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

const userOrder = `19 mm bord 3 ps 7× 4
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

async function testOrderParse() {
    try {
        console.log("Testing order parsing with gemini-2.5-flash-lite-preview-09-2025...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });

        const result = await model.generateContent([
            SYSTEM_PROMPT,
            `User Request: "${userOrder}"`
        ]);

        const response = await result.response;
        const text = response.text();
        console.log("\n=== RAW RESPONSE ===");
        console.log(text);
        console.log("\n=== PARSING JSON ===");

        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');

        if (startIndex !== -1 && endIndex !== -1) {
            const jsonString = text.substring(startIndex, endIndex + 1);
            const parsed = JSON.parse(jsonString);
            console.log("SUCCESS! Parsed", parsed.items.length, "items");
            console.log("Items:", parsed.items.map(i => `${i.quantity}x ${i.name}`).join(", "));
        } else {
            console.log("ERROR: No JSON found in response");
        }

    } catch (error) {
        console.error("ERROR:", error.message, error.status || "");
    }
}

testOrderParse();
