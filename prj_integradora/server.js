import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();

const app = express();

/* global process */

const port = (() => {
  const p = process.env?.PORT;
  const n = Number(p);
  return Number.isFinite(n) && n > 0 ? n : 3001;
})();

app.use(cors());

app.use(express.json({ limit: "1mb" }));

const geminiKey = process.env?.GEMINI_API_KEY
  ? String(process.env.GEMINI_API_KEY).trim()
  : undefined;

const geminiModel = process.env?.GEMINI_MODEL
  ? String(process.env.GEMINI_MODEL).trim()
  : "gemini-3.5-flash";

const ai = new GoogleGenAI({ apiKey: geminiKey });

async function callGeminiWithRetry(promptText, attempts = 3) {
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY não definido.");
  }

  const baseDelay = 500;
  let lastError;

  for (let i = 0; i < attempts; i++) {
    try {
      const interaction = await ai.interactions.create({
        model: geminiModel,
        input: promptText,
      });

      return interaction;
    } catch (error) {
      lastError = error;

      const status =
        error?.status ||
        error?.response?.status ||
        error?.response?.data?.status;

      const isRetryable =
        status === 429 || (typeof status === "number" && status >= 500);

      if (!isRetryable || i === attempts - 1) {
        throw error;
      }

      const delay =
        baseDelay * Math.pow(2, i) + Math.floor(Math.random() * 200);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function extractGeminiText(interaction) {
  if (!interaction) return "";
  if (typeof interaction.output_text === "string") {
    return interaction.output_text.trim();
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
    const prompt = `Você é um assistente que EXPLICA CÓDIGO.

Tarefa:
1) Leia o código abaixo.
2) Explique o que ele faz de forma fiel ao código.
3) A explicação deve estar ALINHADA com a linguagem selecionada: ${language}.
4) Descreva o fluxo (passo a passo) e a finalidade.
5) Quando houver um resultado final evidente (ex.: console.log/soma/retorno), diga explicitamente qual seria o valor/resultado esperado pelo código.
6) Não invente variáveis/funcionalidades que não existam no trecho.

Regras:
- Responda SEMPRE em PT-BR.

Formato (responda exatamente assim):
- Visão geral (1-3 linhas)
- Fluxo passo a passo (bullet points)
- Resultado/saída esperada (se aplicável)
- Observações importantes
- Máximo 20 linhas

Linguagem: ${language}
Código:
${code}`;

    const response = await callGeminiWithRetry(prompt);
    const explanation =
      extractGeminiText(response) || "Não foi possível gerar a explicação.";

    if (!explanation || !String(explanation).trim()) {
      return res.status(502).json({
        ok: false,
        error:
          "A API retornou uma resposta vazia. Tente novamente ou revise o código colado.",
      });
    }

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
