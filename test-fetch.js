
const API_KEY = "AIzaSyBH5hX563AVE0WIMynDWjKcxibtQlkzU94";

async function testFetch() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [{
            parts: [{ text: "Hello, explain how AI works in 1 sentence." }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Body:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testFetch();
