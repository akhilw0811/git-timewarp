import React, { useState, useEffect } from "react";
import { DiffEditor } from "@monaco-editor/react";
import axios from "axios";
import { getApiBase } from "../lib/config";

interface DiffModalProps {
  commitId: string;
  filePath: string;
  onClose: () => void;
}

interface DiffData {
  before: string;
  after: string;
}

export default function DiffModal({
  commitId,
  filePath,
  onClose,
}: DiffModalProps) {
  const detectLanguage = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase() || "";
    if (["ts", "tsx"].includes(ext)) return "typescript";
    if (ext === "js") return "javascript";
    if (ext === "py") return "python";
    if (ext === "json") return "json";
    if (["yml", "yaml"].includes(ext)) return "yaml";
    if (["md", "markdown"].includes(ext)) return "markdown";
    if (["css"].includes(ext)) return "css";
    if (["html", "htm"].includes(ext)) return "html";
    if (["go"].includes(ext)) return "go";
    if (["rs"].includes(ext)) return "rust";
    if (["java"].includes(ext)) return "java";
    if (["kt", "kts"].includes(ext)) return "kotlin";
    if (["rb"].includes(ext)) return "ruby";
    if (["sh", "bash"].includes(ext)) return "shell";
    if (["sql"].includes(ext)) return "sql";
    return "plaintext";
  };
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch diff data
  useEffect(() => {
    const fetchDiff = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${getApiBase()}/diff/${commitId}/${filePath}`,
        );
        setDiffData(response.data);
      } catch (err) {
        setError("Failed to fetch diff data");
        console.error("Error fetching diff:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiff();
  }, [commitId, filePath]);

  // Handle background click to close
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackgroundClick}
      >
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="text-white">Loading diff...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackgroundClick}
      >
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-gray-900 rounded-lg w-11/12 h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{filePath}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 p-4">
          <DiffEditor
            height="100%"
            language={detectLanguage(filePath)}
            theme="vs-dark"
            original={diffData?.before || ""}
            modified={diffData?.after || ""}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: "on",
              lineNumbers: "on",
              folding: true,
              renderWhitespace: "selection",
            }}
          />
        </div>
      </div>
    </div>
  );
}
