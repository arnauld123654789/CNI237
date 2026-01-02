
const API_KEY = "AIzaSyDG7-KeuLVGa1eDTfjGXMAJjwS44tauMNc";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        const res = await fetch(url);
        const data = await res.json();
        const models = data.models || [];
        const contentModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        contentModels.forEach(m => console.log(m.name));
    } catch (e) {
        console.error(e);
    }
}

listModels();
