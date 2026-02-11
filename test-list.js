
const API_KEY = "AIzaSyBH5hX563AVE0WIMynDWjKcxibtQlkzU94";

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Available Models:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("List Error:", error);
    }
}

listModels();
