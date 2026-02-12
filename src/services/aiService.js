import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const ENDPOINT = "https://models.github.ai/inference";
const MODEL_NAME = "meta/Llama-4-Maverick-17B-128E-Instruct-FP8";

const REQUIRED_FIELDS = [
    "first_name",
    "last_name",
    "father_name",
    "mother_name",
    "birth_date",
    "issue_place"
];

const KEY_ALIASES = {
    first_name: [
        "first_name",
        "firstname",
        "given_names",
        "given_name",
        "prenom",
        "prenoms",
        "forenames"
    ],
    last_name: [
        "last_name",
        "lastname",
        "surname",
        "family_name",
        "nom"
    ],
    father_name: [
        "father_name",
        "fathername",
        "fathers_name",
        "nom_du_pere",
        "nomdupere",
        "pere",
        "father"
    ],
    mother_name: [
        "mother_name",
        "mothername",
        "mothers_name",
        "nom_de_la_mere",
        "nomdelamere",
        "mere"
    ],
    birth_date: [
        "birth_date",
        "birthdate",
        "date_of_birth",
        "dateofbirth",
        "date_naissance",
        "datenaissance",
        "dob"
    ],
    issue_place: [
        "issue_place",
        "issueplace",
        "place_of_issue",
        "placeofissue",
        "lieu_demission",
        "lieudemission",
        "lieu_de_delivrance",
        "lieudedelivrance",
        "delivre_a",
        "issued_at",
        "address",
        "adresse",
        "poste_identification"
    ]
};

function emptyExtractionResult() {
    return REQUIRED_FIELDS.reduce((acc, key) => {
        acc[key] = "";
        return acc;
    }, {});
}

function normalizeLookupKey(key) {
    return String(key || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function toText(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/\s+/g, " ").trim();
}

function cleanName(value) {
    return toText(value)
        .replace(
            /^(?:nom\/surname|nom|surname|prenoms?\/given\s*names?|prenoms?|given\s*names?|father'?s?\s*name|mother'?s?\s*name|nom\s*du\s*pere|nom\s*de\s*la\s*mere)\s*[:\-]\s*/i,
            ""
        )
        .trim();
}

function cleanIssuePlace(value) {
    return toText(value)
        .replace(
            /^(?:lieu\s*d'?emission|lieu\s*de\s*delivrance|place\s*of\s*issue|issued\s*at|delivre\s*a|adresse|address|poste\s*d'?identification|identification\s*post|autorite|authority)\s*[:\-]\s*/i,
            ""
        )
        .trim();
}

function isValidDateParts(year, month, day) {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);

    if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
    if (y < 1900 || y > 2100) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;

    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
        dt.getUTCFullYear() === y &&
        dt.getUTCMonth() === m - 1 &&
        dt.getUTCDate() === d
    );
}

function normalizeBirthDate(value) {
    const raw = toText(value);
    if (!raw) return "";

    const compact = raw.replace(/\s+/g, "");

    let match = compact.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) {
        const [, y, m, d] = match;
        if (isValidDateParts(y, m, d)) {
            return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
    }

    match = compact.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (match) {
        const [, d, m, y] = match;
        if (isValidDateParts(y, m, d)) {
            return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
    }

    return "";
}

function splitNameTokens(value) {
    return toText(value)
        .split(/[\s'-]+/)
        .map((token) => normalizeLookupKey(token))
        .filter(Boolean);
}

function countOverlap(tokens, tokenSet) {
    let count = 0;
    for (const token of tokens) {
        if (tokenSet.has(token)) count += 1;
    }
    return count;
}

function maybeSwapNameFields(result) {
    const firstTokens = splitNameTokens(result.first_name);
    const lastTokens = splitNameTokens(result.last_name);
    if (!firstTokens.length || !lastTokens.length) return;

    const parentTokens = new Set(
        [...splitNameTokens(result.father_name), ...splitNameTokens(result.mother_name)]
            .filter((token) => token.length >= 3)
    );

    const firstOverlap = countOverlap(firstTokens, parentTokens);
    const lastOverlap = countOverlap(lastTokens, parentTokens);

    const structureSuggestsSwap = firstTokens.length <= 2 && lastTokens.length >= 3;
    const parentsSuggestSwap =
        parentTokens.size > 0 &&
        lastOverlap > firstOverlap &&
        firstOverlap === 0;
    const labelsSuggestSwap =
        /\b(?:nom|surname)\b/i.test(result.first_name) &&
        !/\b(?:nom|surname)\b/i.test(result.last_name);

    if (labelsSuggestSwap || (structureSuggestsSwap && parentsSuggestSwap)) {
        const tmp = result.first_name;
        result.first_name = result.last_name;
        result.last_name = tmp;
    }
}

function extractContentString(content) {
    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === "string") return part;
                if (!part || typeof part !== "object") return "";
                if (typeof part.text === "string") return part.text;
                if (typeof part.output_text === "string") return part.output_text;
                return "";
            })
            .join("\n");
    }

    if (content && typeof content === "object") {
        return JSON.stringify(content);
    }

    return "";
}

function parseModelJson(content) {
    const text = extractContentString(content)
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    if (!text) return null;

    const candidates = [text];
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch && objectMatch[0] !== text) {
        candidates.push(objectMatch[0]);
    }

    for (const candidate of candidates) {
        try {
            const parsed = JSON.parse(candidate);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch (_error) {
            // Continue with next candidate
        }
    }

    return null;
}

function buildNormalizedMap(raw) {
    const map = new Map();
    for (const [key, value] of Object.entries(raw || {})) {
        const normalized = normalizeLookupKey(key);
        if (!normalized || map.has(normalized)) continue;
        map.set(normalized, value);
    }
    return map;
}

function pickMappedValue(raw, normalizedMap, aliases) {
    for (const alias of aliases) {
        const direct = toText(raw?.[alias]);
        if (direct) return direct;

        const normalized = normalizeLookupKey(alias);
        const mapped = toText(normalizedMap.get(normalized));
        if (mapped) return mapped;
    }
    return "";
}

function normalizeExtraction(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return emptyExtractionResult();
    }

    const normalizedMap = buildNormalizedMap(raw);
    const result = emptyExtractionResult();

    for (const field of REQUIRED_FIELDS) {
        result[field] = pickMappedValue(raw, normalizedMap, KEY_ALIASES[field]);
    }

    result.first_name = cleanName(result.first_name);
    result.last_name = cleanName(result.last_name);
    result.father_name = cleanName(result.father_name);
    result.mother_name = cleanName(result.mother_name);
    result.birth_date = normalizeBirthDate(result.birth_date);
    result.issue_place = cleanIssuePlace(result.issue_place);

    if (!result.issue_place) {
        const fallbackIssueValues = Object.entries(raw)
            .filter(([key, value]) => {
                const normalized = normalizeLookupKey(key);
                if (!toText(value)) return false;
                return /issue|delivr|emiss|lieu|address|adresse|poste|authority|autorite/.test(normalized);
            })
            .map(([, value]) => cleanIssuePlace(value))
            .filter(Boolean);

        if (fallbackIssueValues.length > 0) {
            result.issue_place = fallbackIssueValues[0];
        }
    }

    maybeSwapNameFields(result);

    return result;
}

export const aiService = {
    /**
     * Extracts CNI data from front and back card images using GitHub AI/Llama.
     * @param {string} frontBase64 - Base64 string of the front image (without prefix).
     * @param {string} backBase64 - Base64 string of the back image (without prefix).
     * @returns {Promise<Object>} - Extracted data object.
     */
    async extractCniData(frontBase64, backBase64) {
        if (!TOKEN) {
            throw new Error("Cle API GitHub manquante (VITE_GITHUB_TOKEN).");
        }

        const client = new ModelClient(ENDPOINT, new AzureKeyCredential(TOKEN));

        const prompt = `
You are a strict OCR extraction engine for Cameroonian National Identity Cards (CNI).
You receive two images of the same card:
- Image 1: FRONT
- Image 2: BACK

Return exactly one JSON object with exactly these keys:
{
  "first_name": "",
  "last_name": "",
  "father_name": "",
  "mother_name": "",
  "birth_date": "",
  "issue_place": ""
}

Mandatory field-label mapping:
1) "NOM/SURNAME" -> "last_name"
2) "PRENOMS/GIVEN NAMES" -> "first_name"
Never swap these two fields. Use label position on the card, not intuition.

Extraction rules:
- Keep names exactly as written (all tokens, no abbreviation).
- Father: value near "Nom du pere / Father name".
- Mother: value near "Nom de la mere / Mother name".
- birth_date must be YYYY-MM-DD (convert from DD.MM.YYYY or DD/MM/YYYY when needed).
- issue_place is place of issuance, not place of birth.

Issue place fallback priority:
1) Lieu de delivrance / Place of issue
2) Delivre a / Issued at / Autorite
3) Poste d'identification
4) Adresse/Address (if nothing else exists)

Quality checks before final JSON:
- first_name must come from PRENOMS/GIVEN NAMES.
- last_name must come from NOM/SURNAME.
- Do not copy place of birth into issue_place.
- If a value is unreadable, return "".

Output constraints:
- JSON only, no markdown, no comments, no extra keys, no null values.
`;

        const messages = [
            { role: "system", content: "You extract CNI fields into strict JSON and follow label-to-field mapping exactly." },
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
                    messages,
                    model: MODEL_NAME,
                    temperature: 0.0,
                    max_tokens: 2048,
                    response_format: { type: "json_object" }
                }
            });

            if (response.status !== "200") {
                throw new Error(`GitHub AI Error: ${response.body.error?.message || response.status}`);
            }

            const content = response.body?.choices?.[0]?.message?.content;
            const parsed = parseModelJson(content);

            if (!parsed) {
                throw new Error("AI returned an invalid JSON extraction payload.");
            }

            return normalizeExtraction(parsed);

        } catch (error) {
            console.error("AI Extraction Error:", error);
            throw error;
        }
    }
};
