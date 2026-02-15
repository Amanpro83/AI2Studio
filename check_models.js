
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API KEY found in .env");
    process.exit(1);
}

console.log("Using API Key:", apiKey.substring(0, 10) + "...");

/*
 * Validating available models manually since ListModels might not be exposed easily 
 * in the high-level helper without looking at docs.
 * We will try a fetch loop.
 */

async function check() {
    const genAI = new GoogleGenerativeAI(apiKey);

    // There isn't a direct listModels on genAI instance in some versions?
    // Let's try to just hit the REST API directly to list models to be sure.

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.models) {
            console.log("\n--- AVAILABLE MODELS ---");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
            console.log("------------------------\n");
        } else {
            console.error("FAILED TO LIST MODELS via REST:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
}

check();
