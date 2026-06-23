import Markdown from "react-markdown";
import RemarkGfm from "remark-gfm";

const CodeExplanation = ({ explanation }) => {
  return (
    <div className="w-full max-w-4xl mt-6 bg-gray-50 p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-semibold mb-2">Explicação:</h2>
      <Markdown remarkPlugins={[RemarkGfm]}>{explanation}</Markdown>
    </div>
  );
};

export default CodeExplanation;
