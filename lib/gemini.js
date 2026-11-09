const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

async function generate(parts) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing.");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.8 } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Gemini request failed (${response.status}).`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
}

export async function generateAdminMedia(buffer, mimeType, context) {
  const descriptionPrompt = "Describe this image precisely in one paragraph. Do not invent details.";
  const description = await generate([{ text: descriptionPrompt }, { inlineData: { mimeType, data: buffer.toString("base64") } }]);
  const captionPrompt = `Write exactly four concise, funny captions for this image. The audience is college students in New York. Context: ${context || "general college life"}. Image: ${description}. Return only a JSON array of four strings.`;
  const raw = await generate([{ text: captionPrompt }]);
  const match = raw.match(/\[[\s\S]*\]/);
  const captions = JSON.parse(match?.[0] || "[]");
  if (!Array.isArray(captions) || captions.length !== 4) throw new Error("Gemini did not return four captions.");
  return { description, captions, descriptionPrompt, captionPrompt, model: MODEL };
}
