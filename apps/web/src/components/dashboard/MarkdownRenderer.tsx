'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function preprocess(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    const isSep = /^\|[-:| ]+\|$/.test(trimmed);
    const isRow = trimmed.startsWith('|') && trimmed.endsWith('|');

    // If this starts a table block, collect all consecutive table lines
    // (including rows that quietly fell out of pipe syntax between tables)
    if (isRow || isSep) {
      const block: string[] = [line];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j].trim();
        const isNextRow = next.startsWith('|') && next.endsWith('|');
        const isNextSep = /^\|[-:| ]+\|$/.test(next);
        // Also grab plain lines that look like orphaned table data
        const isOrphan = /^[A-Za-z0-9].{0,60}$/.test(next) && !next.includes('```') && !next.startsWith('#');

        if (isNextRow || isNextSep) {
          block.push(lines[j]);
          j++;
        } else if (isOrphan && j > i + 1 && (block.length > 1 || isSep)) {
          // Orphaned content between table rows — wrap in pipes to merge
          block.push('| ' + next + ' |');
          j++;
        } else if (next === '' && j + 1 < lines.length) {
          const afterBlank = lines[j + 1].trim();
          const isAfterRow = afterBlank.startsWith('|') && afterBlank.endsWith('|');
          const isAfterSep = /^\|[-:| ]+\|$/.test(afterBlank);
          if (isAfterRow || isAfterSep) {
            // blank line between tables → skip, merge them
            j++;
            continue;
          }
          break;
        } else {
          break;
        }
      }

      for (const l of block) out.push(l);
      i = j;
    } else {
      out.push(line);
      i++;
    }
  }

  return out.join('\n');
}

const tableComponents: Components = {
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-lagos-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="even:bg-gray-50/50">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-lagos-800">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm text-gray-700">{children}</td>
  ),
};

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  const processed = preprocess(content);

  return (
    <div
      className={`prose prose-lg max-w-none prose-headings:font-super-pandora prose-headings:text-gray-800 prose-p:text-gray-700 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-code:text-gray-800 prose-pre:rounded-xl prose-pre:bg-gray-900 prose-pre:text-sm prose-a:text-lagos-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-800 prose-ul:my-2 prose-li:my-0.5 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={tableComponents}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
