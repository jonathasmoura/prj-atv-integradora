import { useState } from "react";
import { explainCode } from "../../actions";
import CodeExplanation from "../CodeExplanation";
import Error from "../Error";

const CodeExplainForm = () => {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [formState, setFormState] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsPending(true);
    setFormState(null);

    const result = await explainCode({ code, language });
    setFormState(result);
    setIsPending(false);
  };

  return (
    <div className="w-full max-w-4xl bg-white p-6 rounded-2xl shadow-lg">
      <form onSubmit={handleSubmit}>
        <label className="block mb-2 font-semibold">Linguagem:</label>
        <select
          name="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="border rounded-lg p-2 w-full mb-4 bg-transparent"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="php">PHP</option>
        </select>

        <label className="block mb-2 font-semibold">Cole aqui seu código</label>
        <textarea
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
          placeholder="Coloque seu código aqui ..."
          className="border rounded-lg w-full p-3 font-mono text-sm bg-transparent min-h-[150px]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isPending ? "Explicando..." : "Explicar Código"}
        </button>
      </form>

      {isPending ? (
        <p className="bg-gray-300 my-3 w-64 p-2 rounded-sm">Pensando...</p>
      ) : formState?.success ? (
        <CodeExplanation explanation={formState?.data.explanation} />
      ) : (
        formState?.success === false && <Error error={formState?.error} />
      )}
    </div>
  );
};

export default CodeExplainForm;
