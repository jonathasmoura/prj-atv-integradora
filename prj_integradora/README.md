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

Caso seja necessário, abra duas abas de prompt e digite:
```bash
npm run backend
```
- Para Backend: `http://localhost:3001` 

```bash
npm run dev
```
- Para Frontend: `http://localhost:5173`


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
<img width="886" height="390" alt="image" src="https://github.com/user-attachments/assets/d8f8182c-a6fd-4fba-8704-9dc1d0a331b2" />
Seleciona um tipo de linguagem, nesse caso JavaScript.
<img width="886" height="437" alt="image" src="https://github.com/user-attachments/assets/ff09be74-2a05-434a-b79c-f8231008b1ab" />

E obtém a resposta solicitada:
<img width="886" height="437" alt="image" src="https://github.com/user-attachments/assets/5e904ff9-6bd5-4278-a67b-bfc770354e93" />

Selecionando outra linguagem, agora o Python:
<img width="886" height="389" alt="image" src="https://github.com/user-attachments/assets/30a20896-96f7-41a7-9ac9-a7105adbebf0" />
Agora a resposta para a solicitação selecionada:
<img width="886" height="510" alt="image" src="https://github.com/user-attachments/assets/e3a946af-bed8-4620-a6a0-1f5ed4d7b70b" />


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

## Inclusão testes unitários

Implementados dois testes que validem, de forma isolada e consistente, as unidades lógicas de envio e de
recebimento do retorno dos dados.

```bash
npm i jest
```

- Comando para rodar os testes
```
 npm run test -- --runInBand --verbose --testLocationInResults
```
- Resultado dos testes
<img width="988" height="323" alt="image" src="https://github.com/user-attachments/assets/84512052-a0ef-42bf-b16b-43597ffce54f" />

