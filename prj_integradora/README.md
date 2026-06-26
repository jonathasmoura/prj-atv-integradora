# prj_integradora

## Objetivo do sistema

Aplicação web que permite o usuário **selecionar uma linguagem**, **colar um trecho de código** e receber uma **explicação do que o código faz**, retornada por uma IA (Google Gemini).

- O backend recebe `{ code, language }`.
- A IA gera uma explicação **em PT-BR** e **alinhada com a linguagem selecionada**.
- O frontend exibe a explicação ou mensagens de erro.

---

## Tecnologias utilizadas

### Frontend

- **React**
- **Vite** (build/dev)
- **Tailwind CSS**

### Backend

- **Node.js**
- **Express**
- **@google/genai** (Google Gemini)
- **dotenv** (carregamento de variáveis de ambiente)
- **cors**

### Outras bibliotecas

- **react-markdown** e **remark-gfm** (renderização de texto/Markdown)
- **concurrently** (rodar frontend e backend em paralelo)
- **ESLint** (lint)

---

## Como inicializar (comandos)

### 1) Instalação

```bash
npm install
```

### 2) Rodar em modo de desenvolvimento

```bash
npm run dev
```

Esse comando inicia:

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

### 3) Build

```bash
npm run build
```

### 4) Preview da build

```bash
npm run preview
```

### 5) Lint

```bash
npm run lint
```

---

## Configurações do projeto (variáveis de ambiente)

O projeto usa variáveis de ambiente via **dotenv**.

> Observação: o sistema espera uma variável `.env` na raiz do projeto.

### Variáveis do backend

- `GEMINI_API_KEY` (obrigatória)
  - Chave de API para acessar o Google Gemini.
- `GEMINI_MODEL` (opcional)
  - Modelo Gemini a ser usado. Default: `gemini-3.5-flash`.
- `PORT` (opcional)
  - Porta do backend. Default: `3001`.

### Variáveis do frontend

- `VITE_API_BASE_URL` (opcional)
  - Base URL da API do backend.
  - Default: `http://localhost:3001/api`

---

## Interfaces e objetivos da execução do sistema

### Interface (o que o usuário faz)

1. Selecionar a **linguagem** (JavaScript, Python, Java, PHP).
2. Colar um **trecho de código** no campo de texto.
3. Clicar em **"Explicar Código"**.
4. Visualizar:
   - a explicação gerada pela IA, ou
   - uma mensagem de erro (ex.: chave não configurada, falha na API, etc.).

### Fluxo de execução (ciclo completo)

1. Frontend chama `POST /api/explain-code` enviando:
   - `code`: o trecho colado
   - `language`: linguagem selecionada
2. Backend valida entradas e a existência de `GEMINI_API_KEY`.
3. Backend monta um prompt instrucional (PT-BR + formato + passo a passo + saída esperada quando aplicável).
4. Backend chama o Gemini com `@google/genai` e aplica retry em casos **retriáveis** (ex.: 429 / 5xx).
5. Backend retorna JSON com `explanation`.
6. Frontend renderiza a explicação na tela (ou exibe o erro).

---

## Endpoints do backend

### `GET /api/health`

Retorna status do backend.

Exemplo de resposta:

```json
{ "ok": true, "message": "backend rodando" }
```

### `POST /api/explain-code`

Recebe o código e retorna a explicação.

**Request body**:

```json
{
  "code": "...",
  "language": "javascript|python|java|php"
}
```

**Response (sucesso)**:

```json
{ "ok": true, "explanation": "..." }
```

**Erros comuns**:

- `500` se `GEMINI_API_KEY` não estiver definida.
- `400` se `code` ou `language` estiverem ausentes.
- `429` quando a cota da API é excedida.
- `502/500` quando a IA retorna resposta vazia ou ocorre falha ao processar.
