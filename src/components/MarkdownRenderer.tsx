import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={`prose prose-sm max-w-none ${className}`}
      components={{
        // Customize heading styles
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
        
        // Customize paragraph styles
        p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
        
        // Customize list styles
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        
        // Customize code styles
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>;
          }
          return <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>;
        },
        pre: ({ children }) => (
          <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-2">
            {children}
          </pre>
        ),
        
        // Customize blockquote styles
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-2">
            {children}
          </blockquote>
        ),
        
        // Customize link styles
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {children}
          </a>
        ),
        
        // Customize table styles
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="min-w-full border border-gray-300 text-xs">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
        th: ({ children }) => <th className="border border-gray-300 px-2 py-1 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="border border-gray-300 px-2 py-1">{children}</td>,
        
        // Customize strong and emphasis
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        
        // Customize horizontal rule
        hr: () => <hr className="border-t border-gray-300 my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer; 