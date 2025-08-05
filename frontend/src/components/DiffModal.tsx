import React from 'react'
import Editor from '@monaco-editor/react'

interface DiffModalProps {
  filePath: string
  onClose: () => void
}

export default function DiffModal({ filePath, onClose }: DiffModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-11/12 h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {filePath}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="flex-1 p-4">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            theme="vs-dark"
            value={`// Diff view for ${filePath}\n// This would show the actual diff content\n\nfunction example() {\n  console.log("File changes would appear here");\n}`}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
            }}
          />
        </div>
      </div>
    </div>
  )
} 