'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className={`prose prose-sm max-w-none prose-headings:font-super-pandora prose-headings:text-gray-800 prose-p:text-gray-700 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-code:text-gray-800 prose-pre:rounded-xl prose-pre:bg-gray-900 prose-pre:text-sm prose-a:text-lagos-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-800 prose-ul:my-2 prose-li:my-0.5 ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
