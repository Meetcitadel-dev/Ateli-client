
import { INVENTORY_ITEMS } from "@/data/inventory";

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const inventoryContext = INVENTORY_ITEMS.map(item =>
  `- ${item.name} (Category: ${item.category}, Unit: ${item.unit}, Price: ₹${item.price})`
).join('\n');

const SYSTEM_PROMPT = `
You are Ateli AI, an expert construction material assistant. You help contractors and site managers order materials easily using natural language, including Hinglish and construction slang.

### CONTEXT
You are working for "Ateli", a premium construction material supplier.
Available Inventory:
${inventoryContext}

### YOUR GOALS
1. **Be Conversational**: Respond like a helpful partner. Use friendly Hinglish where appropriate (e.g., "Samajh gaya", "Theek hai", "Aapka order ready hai").
2. **Understand "Illiterate" Input**: Users might type poorly (e.g., "10 bord 19mm", "5 kabja set", "fevicol 1kg 2 dabbe"). You must parse these correctly.
3. **Map Slang to Inventory**: 
   - "bord" or "ply" -> Board (check thickness like 19mm, 18mm)
   - "kabja" -> Hinge
   - "mica" -> Laminate
   - "fevicol" -> Adhesive
4. **Handle Ambiguity**: If a user says "19mm board" but there are multiple sizes (7x4, 6x4) in inventory, pick the most common (7x4) but mention it in your response.

### RESPONSE STRUCTURE
You MUST return ONLY a JSON object. No other text.
{
  "chatResponse": "A friendly, conversational message in Hinglish/English. Explain what you understood and any assumptions made.",
  "orderDraft": {
    "items": [
      {
        "name": "Exact Name from Inventory",
        "description": "Specifics like '7x4', 'Soft Close', etc.",
        "quantity": number,
        "estimatedUnitPrice": number
      }
    ]
  } | null
}

### RULES
- Set "orderDraft" to null if no clear items are being ordered (e.g., just saying hello or asking a general question).
- If the user specifies a quantity but the item isn't in inventory, explain this in "chatResponse".
- Correct obvious typos.
- DO NOT use markdown code blocks (\`\`\`json).
`;

export async function getAIUpdate(userText: string, history: { role: 'user' | 'model', text: string }[] = []) {
  try {
    if (!API_KEY) {
      throw new Error("OpenRouter API Key missing. Please check your .env file.");
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.text
      })),
      { role: "user", content: userText }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8082", // Optional, for OpenRouter analytics
        "X-Title": "Ateli AI" // Optional
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: messages,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    console.log("OpenRouter Raw Response:", data);

    if (data.error) {
      throw new Error(data.error.message || "OpenRouter Error");
    }

    const text = data.choices[0].message.content.trim();

    // Robust JSON extraction
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No JSON object found in AI response");
    }

    const jsonString = text.substring(startIndex, endIndex + 1);
    const parsed = JSON.parse(jsonString);

    return {
      chatResponse: parsed.chatResponse || "I've processed your message. How else can I help?",
      orderDraft: parsed.orderDraft || null
    };

  } catch (error: any) {
    console.error("Ateli AI Error:", error);

    return {
      chatResponse: `I ran into an error: ${error.message || "Something went wrong"}. Please try again.`,
      orderDraft: null
    };
  }
}

export async function parseOrderWithGemini(userText: string) {
  const result = await getAIUpdate(userText);
  return result.orderDraft;
}
