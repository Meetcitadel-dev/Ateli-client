
const API_KEY = "AIzaSyBH5hX563AVE0WIMynDWjKcxibtQlkzU94";

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("No models found or error:", JSON.stringify(data));
        }
    } catch (error) {
        console.error("List Error:", error);
    }
}

listModels();
