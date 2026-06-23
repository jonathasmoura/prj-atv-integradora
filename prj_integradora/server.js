import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = (() => {
  const p =
    typeof process !== "undefined" && process.env && process.env.PORT
      ? process.env.PORT
      : undefined;
  const n = Number(p);
  return Number.isFinite(n) && n > 0 ? n : 3001;
})();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const geminiKey =
  typeof process !== "undefined" && process.env && process.env.GEMINI_API_KEY
    ? String(process.env.GEMINI_API_KEY).trim()
    : undefined;
const geminiModel =
  typeof process !== "undefined" && process.env && process.env.GEMINI_MODEL
    ? String(process.env.GEMINI_MODEL).trim()
    : "gemini-1.0";

async function callGeminiWithRetry(promptText, attempts = 3) {
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY não definido.");
  }

  const normalizedModel = String(geminiModel || "").replace(/^models\//i, "");
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(
    normalizedModel,
  )}:generate?key=${encodeURIComponent(geminiKey)}`;

  const body = {
    input: [
      {
        role: "user",
        content: [{ type: "text", text: promptText }],
      },
    ],
    temperature: 0.2,
    maxOutputTokens: 512,
  };

  const baseDelay = 500;
  for (let i = 0; i < attempts; i++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = undefined;
    }

    if (response.ok) {
      return parsedBody ?? { raw: responseText };
    }

    const isRetryable = response.status === 429 || response.status >= 500;
    if (!isRetryable || i === attempts - 1) {
      const errMessage =
        parsedBody?.error?.message || parsedBody?.error || responseText;
      const error = new Error(
        `Gemini API retornou ${response.status}: ${errMessage}`,
      );
      error.status = response.status;
      error.details = parsedBody;
      throw error;
    }

    const delay = baseDelay * Math.pow(2, i) + Math.floor(Math.random() * 200);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

function extractGeminiText(data) {
  if (!data) return "";
  if (Array.isArray(data.candidates)) {
    return data.candidates
      .map((candidate) => {
        const content = candidate?.content;
        if (typeof content === "string") return content;
        if (Array.isArray(content)) {
          return content.map((item) => item?.text || "").join("");
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  if (typeof data.output_text === "string") return data.output_text.trim();
  if (typeof data.generated_text === "string")
    return data.generated_text.trim();
  if (typeof data.text === "string") return data.text.trim();
  if (typeof data.output === "string") return data.output.trim();
  if (Array.isArray(data.output)) {
    return data.output
      .map((item) => item?.text || "")
      .join("\n")
      .trim();
  }
  return "";
}

app.get("/api/health", (_req, res) => {
  return res.json({ ok: true, message: "backend rodando" });
});

app.post("/api/explain-code", async (req, res) => {
  const { code, language } = req.body || {};

  if (!geminiKey) {
    return res.status(500).json({
      ok: false,
      error:
        "GEMINI_API_KEY não encontrado. Configure seu .env e reinicie o servidor.",
    });
  }

  if (!code || !language) {
    return res
      .status(400)
      .json({ error: "Código e linguagem são obrigatórios." });
  }

  try {
    const prompt = `Você é um assistente que explica código. Leia o código abaixo e explique o que ele faz, destacando os pontos principais, o fluxo e a finalidade.\n\nLinguagem: ${language}\nCódigo:\n${code}\n\nExplique de forma clara e objetiva.`;

    const response = await callGeminiWithRetry(prompt);
    const explanation =
      extractGeminiText(response) || "Não foi possível gerar a explicação.";

    return res.json({ ok: true, explanation });
  } catch (error) {
    console.error("Gemini request failed:", error);
    const message = error?.message || String(error);
    const isQuotaError = /429|quota|rate limit|exceeded/i.test(message);
    const status =
      error?.status ||
      error?.response?.status ||
      (isQuotaError ? 429 : undefined);

    if (status === 429 || isQuotaError) {
      return res.status(429).json({
        ok: false,
        error:
          "Cota da API excedida (429). Verifique seu plano e faturamento na Gemini.",
      });
    }

    return res.status(500).json({
      ok: false,
      error: `Erro ao processar a requisição: ${message}`,
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:${port}`);
});
