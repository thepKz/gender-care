import React from 'react';

interface Props {
  htmlContent: string;
  className?: string;
}

const EditorOutputDisplay: React.FC<Props> = ({ htmlContent, className = '' }) => {
  return (
    <div className={`editor-output ${className}`}>
      <style>{`
        .editor-output {
          line-height: 1.6;
          color: #374151;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
        }

        .editor-output h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 24px 0 16px 0;
          line-height: 1.2;
          color: #0C3C54;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .editor-output h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 20px 0 12px 0;
          line-height: 1.3;
          color: #0C3C54;
        }

        .editor-output h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 16px 0 8px 0;
          line-height: 1.4;
          color: #0C3C54;
        }

        .editor-output h4 {
          font-size: 18px;
          font-weight: 600;
          margin: 12px 0 8px 0;
          line-height: 1.4;
          color: #0C3C54;
        }

        .editor-output p {
          margin: 12px 0;
          line-height: 1.7;
        }

        .editor-output a {
          color: #0C3C54;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.2s ease;
          padding: 2px 4px;
          margin: 0 -2px;
          border-radius: 4px;
        }

        .editor-output a:hover {
          border-bottom-color: #0C3C54;
          background-color: rgba(12, 60, 84, 0.08);
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
          margin: 16px 0;
          padding-left: 32px;
        }

        .editor-output ul li {
          list-style-type: disc;
          margin: 8px 0;
        }

        .editor-output ol li {
          list-style-type: decimal;
          margin: 8px 0;
        }

        .editor-output ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .editor-output ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          margin: 8px 0;
          padding-left: 0;
        }

        .editor-output ul[data-type="taskList"] li input[type="checkbox"] {
          margin-right: 12px;
          margin-top: 2px;
          cursor: pointer;
        }

        .editor-output blockquote {
          border-left: 4px solid #0C3C54;
          background-color: #f8fafc;
          padding: 16px 24px;
          margin: 24px 0;
          font-style: italic;
          color: #64748b;
          border-radius: 0 8px 8px 0;
        }

        .editor-output blockquote p {
          margin: 0;
        }

        .editor-output pre {
          background: #1f2937;
          color: #f9fafb;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          overflow-x: auto;
          font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.5;
        }

        .editor-output code {
          background: #f1f5f9;
          color: #e11d48;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
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
          margin: 24px 0;
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .editor-output table td, 
        .editor-output table th {
          border: 1px solid #e5e7eb;
          padding: 12px 16px;
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
          margin: 16px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .editor-output iframe {
          border-radius: 8px;
          margin: 24px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .editor-output {
            font-size: 13px;
          }
          
          .editor-output h1 {
            font-size: 28px;
          }
          
          .editor-output h2 {
            font-size: 22px;
          }
          
          .editor-output h3 {
            font-size: 18px;
          }
          
          .editor-output table {
            font-size: 12px;
          }
          
          .editor-output table td, 
          .editor-output table th {
            padding: 8px;
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
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
};

export default EditorOutputDisplay; 