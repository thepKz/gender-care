import React from 'react';

interface Props {
  children: React.ReactNode;
}

const EditorStyles: React.FC<Props> = ({ children }) => {
  return (
    <div className="editor-output">
      <style>{`
        .editor-output {
          line-height: 1.6;
          color: #374151;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .editor-output h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem 0;
          line-height: 1.2;
          color: #0C3C54;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .editor-output h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem 0;
          line-height: 1.3;
          color: #0C3C54;
        }

        .editor-output h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.4;
          color: #0C3C54;
        }

        .editor-output h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem 0;
          line-height: 1.4;
          color: #0C3C54;
        }

        .editor-output p {
          margin: 0.75rem 0;
          line-height: 1.7;
        }

        .editor-output a {
          color: #0C3C54;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .editor-output a:hover {
          border-bottom-color: #0C3C54;
          background-color: rgba(12, 60, 84, 0.05);
          padding: 0 2px;
          margin: 0 -2px;
          border-radius: 2px;
        }

        .editor-output strong {
          font-weight: 600;
          color: #1f2937;
        }

        .editor-output em {
          font-style: italic;
        }

        .editor-output u {
          text-decoration: underline;
          text-decoration-color: #6b7280;
        }

        .editor-output s {
          text-decoration: line-through;
          text-decoration-color: #ef4444;
        }

        .editor-output sub {
          vertical-align: sub;
          font-size: 0.75em;
        }

        .editor-output sup {
          vertical-align: super;
          font-size: 0.75em;
        }

        .editor-output ul, .editor-output ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }

        .editor-output ul li {
          list-style-type: disc;
          margin: 0.5rem 0;
        }

        .editor-output ol li {
          list-style-type: decimal;
          margin: 0.5rem 0;
        }

        .editor-output ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .editor-output ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          margin: 0.5rem 0;
          padding-left: 0;
        }

        .editor-output ul[data-type="taskList"] li input[type="checkbox"] {
          margin-right: 0.75rem;
          margin-top: 0.125rem;
          cursor: pointer;
        }

        .editor-output blockquote {
          border-left: 4px solid #0C3C54;
          background-color: #f8fafc;
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #64748b;
          border-radius: 0 4px 4px 0;
        }

        .editor-output blockquote p {
          margin: 0;
        }

        .editor-output pre {
          background: #1f2937;
          color: #f9fafb;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          overflow-x: auto;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .editor-output code {
          background: #f1f5f9;
          color: #e11d48;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
        }

        .editor-output pre code {
          background: transparent;
          color: inherit;
          padding: 0;
          border-radius: 0;
          font-size: inherit;
        }

        .editor-output table {
          border-collapse: collapse;
          margin: 1.5rem 0;
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .editor-output table td, 
        .editor-output table th {
          border: 1px solid #e5e7eb;
          padding: 0.75rem 1rem;
          vertical-align: top;
          text-align: left;
        }

        .editor-output table th {
          background-color: #f8fafc;
          font-weight: 600;
          color: #374151;
        }

        .editor-output table tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .editor-output table tr:hover {
          background-color: #f1f5f9;
        }

        .editor-output img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .editor-output iframe {
          border-radius: 8px;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .editor-output {
            font-size: 0.9rem;
          }
          
          .editor-output h1 {
            font-size: 1.75rem;
          }
          
          .editor-output h2 {
            font-size: 1.375rem;
          }
          
          .editor-output h3 {
            font-size: 1.125rem;
          }
          
          .editor-output table {
            font-size: 0.875rem;
          }
          
          .editor-output table td, 
          .editor-output table th {
            padding: 0.5rem;
          }
        }

        /* Print Styles */
        @media print {
          .editor-output {
            color: #000;
            background: #fff;
          }
          
          .editor-output a {
            color: #000;
            text-decoration: underline;
          }
          
          .editor-output blockquote {
            border-left-color: #000;
            background: #f5f5f5;
          }
        }
      `}</style>
      {children}
    </div>
  );
};

export default EditorStyles; 