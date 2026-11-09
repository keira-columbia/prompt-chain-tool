const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

export async function runPromptStep(instruction, input) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing.");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: `${instruction}\n\nInput from the previous stage:\n${input}` }] }], generationConfig: { temperature: 0.8 } }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Gemini request failed (${response.status}).`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "No output returned.";
}

export { MODEL };
