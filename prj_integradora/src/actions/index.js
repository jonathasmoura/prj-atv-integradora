const API_BASE_URL =
  (import.meta?.env && import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:3001/api";

export async function explainCode({ code, language }) {
  if (!code || !language) {
    return {
      success: false,
      error: "Informe uma linguagem e cole o código para explicar.",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/explain-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `Falha ao chamar a API: ${res.status} ${text}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: `Ocorreu uma falha: ${err?.message || "Erro desconhecido"}`,
    };
  }
}
