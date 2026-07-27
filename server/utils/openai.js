const { AppError } = require("../middleware/error");

async function generateSummary({
  content,
  systemPrompt,
  model = "gemini-flash-latest",
  maxOutputTokens = 5000,
  temperature = 0.3,
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError("Gemini API key not configured on server", 500);
  }
  

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: content }],
        },
      ],
      generationConfig: {
        maxOutputTokens,
        temperature,
      },
    }),
  }
  );

  if (!response.ok) {
    const errText = await response.text();
    let message = `Gemini API error: ${errText}`;

    try {
      const parsed = JSON.parse(errText);
      const geminiMessage = parsed?.error?.message;
      if (geminiMessage) {
        message = geminiMessage;
      }
    } catch {
      // Keep the raw response text when it is not JSON.
    }

    throw new AppError(message, response.status);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""
  );
}

module.exports = { generateSummary };