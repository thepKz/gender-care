import React from 'react';
import { Editor } from '@tiptap/react';

interface Props {
  editor: Editor;
}

const WordCount: React.FC<Props> = ({ editor }) => {
  if (!editor) return null;

  const text = editor.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const charactersWithoutSpaces = text.replace(/\s/g, '').length;

  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 px-2">
      <span>
        <strong>{words}</strong> từ
      </span>
      <span>
        <strong>{characters}</strong> ký tự
      </span>
      <span>
        <strong>{charactersWithoutSpaces}</strong> ký tự (không khoảng trắng)
      </span>
    </div>
  );
};

export default WordCount; 