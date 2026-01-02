
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const ENDPOINT = "https://models.github.ai/inference";
const MODEL_NAME = "meta/Llama-4-Maverick-17B-128E-Instruct-FP8";

export const aiService = {
    /**
     * Extracts CNI data from front and back card images using GitHub AI/Llama.
     * @param {string} frontBase64 - Base64 string of the front image (without prefix).
     * @param {string} backBase64 - Base64 string of the back image (without prefix).
     * @returns {Promise<Object>} - Extracted data object.
     */
    async extractCniData(frontBase64, backBase64) {
        if (!TOKEN) {
            throw new Error("Clé API GitHub manquante (VITE_GITHUB_TOKEN).");
        }

        const client = new ModelClient(ENDPOINT, new AzureKeyCredential(TOKEN));

        const prompt = `
You are a senior OCR + document intelligence expert specialized in Cameroonian National Identity Cards (CNI).

You are given TWO images of the SAME CNI:
- Image 1: FRONT of the card
- Image 2: BACK of the card

Your goal is to extract identity information with MAXIMUM PRECISION, especially:
- Person's full name
- Father's full name
- Mother's full name
- Place of issuance (Lieu de délivrance)

--------------------
FIELDS TO EXTRACT
--------------------
Return a single JSON object with EXACTLY these keys:

{
  "first_name": "",
  "last_name": "",
  "father_name": "",
  "mother_name": "",
  "birth_date": "",
  "issue_place": ""
}

--------------------
CRITICAL EXTRACTION RULES
--------------------
1. Names MUST be extracted exactly as written on the card.
   - Preserve full spelling.
   - Preserve accents (é, è, ô, à) when visible.
   - DO NOT merge first and last names.
   - DO NOT abbreviate.
   - DO NOT invent missing parts but your top priority is to extract the names as they are written on the card all the names do not ignore any note a person can have many names .
   - make sur absolutely all his names are extracted exactly.
2. Parent names:
   - Father's name usually appears as "Nom du père".
   - Mother's name usually appears as "Nom de la mère".
   - Extract FULL names, not partial.
   - If only one parent name is visible, leave the other as "".

3. Issue place (Lieu de délivrance):
   - Extract the official place of issuance, NOT the place of birth.
   - Usually contains words like "Commissariat", "Délivré à", or a city name.
   - Example: "Commissariat Central N°1 Yaoundé".

4. Birth date:
   - Convert to ISO format: YYYY-MM-DD.
   - If day or month is unclear, still infer if clearly readable.
   - If not readable, return "".

5. OCR correction rules:
   - Fix obvious OCR mistakes (0 ↔ O, 1 ↔ I, 5 ↔ S).
   - Do NOT guess unclear letters.
   

6. Multi-image logic:
   - Cross-check FRONT and BACK images.
   - If a field appears on both, choose the clearest version.
   - NEVER duplicate values across fields.

--------------------
STRICT OUTPUT FORMAT
--------------------
- Output MUST be valid JSON only.
- No markdown.
- No comments.
- No explanations.
- No extra fields.
- Missing or unreadable fields must be "" (empty string).
- Do NOT return null.

This task is INFORMATION EXTRACTION, not summarization.
Accuracy is more important than completeness.
`;


        // Construct the payload with images
        // Note: Standard chat completion with vision usually expects data:image/jpeg;base64,...
        const messages = [
            { role: "system", content: "You are a helpful AI assistant that extracts data from ID cards into JSON." },
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${frontBase64}`
                        }
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${backBase64}`
                        }
                    }
                ]
            }
        ];

        try {
            const response = await client.path("/chat/completions").post({
                body: {
                    messages: messages,
                    model: MODEL_NAME,
                    temperature: 0.1, // Low temperature for factual extraction
                    max_tokens: 2048,
                    response_format: { type: "json_object" } // Try to enforce JSON mode if supported
                }
            });

            if (response.status !== "200") {
                throw new Error(`GitHub AI Error: ${response.body.error?.message || response.status}`);
            }

            const content = response.body.choices[0].message.content;

            // Clean up potential markdown code blocks if the model adds them despite instructions
            const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();

            return JSON.parse(cleanJson);

        } catch (error) {
            console.error("AI Extraction Error:", error);
            throw error;
        }
    }
};
