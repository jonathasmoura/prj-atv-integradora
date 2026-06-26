// Mock do import.meta.env precisa ocorrer antes de importar o módulo sob teste.
// Jest (com ESM) não garante que import.meta.env seja mutável.
// Então criamos um fallback no próprio módulo sob teste via mock do import.meta.env.
// A forma mais robusta aqui é definir import.meta.env antes do import do módulo.
const envBackup = import.meta.env;
import.meta.env = {
  ...envBackup,
  VITE_API_BASE_URL: "http://localhost:3001/api",
};

const { explainCode } = await import("./index.js");

const describe = globalThis.describe;

const it = globalThis.it;
const expect = globalThis.expect;

function beforeEach(fn) {
  globalThis.beforeEach(fn);
}

const vi = {
  fn: (impl) => {
    // Em Jest, `globalThis.jest` nem sempre está disponível em ESM
    // (depende do runner). Para manter o teste simples, usamos uma mock manual.
    const fn = (...args) => {
      fn.mock.calls.push(args);
      return impl ? impl(...args) : undefined;
    };
    fn.mock = { calls: [] };
    return fn;
  },
};

// Observação: estes testes validam isoladamente:
// 1) o envio (fetch chamado com URL/método/headers/body corretos)
// 2) o recebimento (interpretação de res.ok + retorno do DTO)

const API_BASE_URL = "http://localhost:3001/api";

// Como o arquivo de produção usa import.meta.env.VITE_API_BASE_URL,
// precisamos mockar import.meta.env.
// Para manter os testes simples, setamos o valor abaixo via global.
// (Em Vitest/Jest ESM, isso tende a exigir config adicional; se necessário,
// ajustes podem ser feitos para o seu runner.)

describe("explainCode (unit)", () => {
  beforeEach(() => {
    // mock manual com a API que o teste usa
    const mock = {
      mock: { calls: [] },
      mockResolvedValueOnce: (value) => {
        mock._nextResolved = value;
      },
    };

    mock.fn = (...args) => {
      mock.mock.calls.push(args);
      return Promise.resolve(mock._nextResolved);
    };

    globalThis.fetch = mock.fn;

    // adiciona helpers para compat com expect
    globalThis.fetch.mock = mock.mock;
    globalThis.fetch.mockResolvedValueOnce = mock.mockResolvedValueOnce;
  });

  it("deve enviar request com método POST, headers e body corretos", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ explanation: "qualquer coisa" }),
    });

    await explainCode({ code: "console.log(1)", language: "javascript" });

    // Como o mock é manual, validamos as chamadas via `mock.calls`
    expect(globalThis.fetch.mock.calls.length).toBe(1);
    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/explain-code`);
    expect(options).toEqual({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "console.log(1)", language: "javascript" }),
    });
  });

  it("deve interpretar resposta ok=false e retornar { success:false, error }", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "rate limit exceeded",
    });

    const result = await explainCode({ code: "x", language: "python" });

    expect(result).toEqual({
      success: false,
      error: `Falha ao chamar a API: 429 rate limit exceeded`,
    });
  });
});
