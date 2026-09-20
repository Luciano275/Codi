import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import {
  CircleAlert,
  Info,
  Lightbulb,
  TriangleAlert,
  type IconComponent,
} from '@/components/ui/Icon';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

type CalloutKind = 'IMPORTANT' | 'NOTE' | 'TIP' | 'WARNING';

interface CalloutStyle {
  label: string;
  Icon: IconComponent;
  className: string;
}

const CALLOUT_MARKER = /^\[!(IMPORTANT|NOTE|TIP|WARNING)\]$/i;
const PLAIN_CALLOUT_MARKER = /^\[!(IMPORTANT|NOTE|TIP|WARNING)\](?:\s+(.*))?$/i;

const calloutStyles: Record<CalloutKind, CalloutStyle> = {
  IMPORTANT: {
    label: 'Importante',
    Icon: CircleAlert,
    className: 'border-desierto-200 bg-desierto-50 text-desierto-900',
  },
  NOTE: {
    label: 'Nota',
    Icon: Info,
    className: 'border-lagos-200 bg-lagos-50 text-lagos-900',
  },
  TIP: {
    label: 'Consejo',
    Icon: Lightbulb,
    className: 'border-pradera-200 bg-pradera-50 text-pradera-900',
  },
  WARNING: {
    label: 'Advertencia',
    Icon: TriangleAlert,
    className: 'border-volcan-200 bg-volcan-50 text-volcan-900',
  },
};

function preprocess(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const plainCallout = trimmed.match(PLAIN_CALLOUT_MARKER);

    if (plainCallout) {
      const [, kind, message] = plainCallout;
      out.push(`> [!${kind.toUpperCase()}]`, '>');
      if (message) out.push(`> ${message}`);
      i++;
      continue;
    }

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
        const isOrphan =
          /^[A-Za-z0-9].{0,60}$/.test(next) && !next.includes('```') && !next.startsWith('#');

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

  return out
    .join('\n')
    .replace(/^(>\s*\[!(?:IMPORTANT|NOTE|TIP|WARNING)\]\s*$)\n(?=>\s*\S)/gim, '$1\n>\n');
}

function getNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return Children.toArray(node).map(getNodeText).join('');
}

function isMarkdownElement(node: ReactNode): node is ReactElement<{ children?: ReactNode }> {
  return isValidElement<{ children?: ReactNode }>(node);
}

function getBlockquoteElements(children: ReactNode) {
  return Children.toArray(children).filter(isMarkdownElement);
}

function getCalloutKind(children: ReactNode): CalloutKind | null {
  const [marker] = getBlockquoteElements(children);
  if (!marker) return null;

  const match = getNodeText(marker.props.children).trim().match(CALLOUT_MARKER);
  return match ? (match[1].toUpperCase() as CalloutKind) : null;
}

function Callout({ kind, children }: { kind: CalloutKind; children: ReactNode }) {
  const { label, Icon, className } = calloutStyles[kind];

  return (
    <aside
      className={`not-prose my-5 rounded-xl border p-4 ${className}`}
      role="note"
      aria-label={label}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-2 text-sm leading-6 [&_a]:font-medium [&_a]:underline [&_ol]:my-2 [&_p]:my-0 [&_ul]:my-2">
        {children}
      </div>
    </aside>
  );
}

const tableComponents: Components = {
  blockquote: ({ children }) => {
    const kind = getCalloutKind(children);
    if (!kind) return <blockquote>{children}</blockquote>;

    return <Callout kind={kind}>{getBlockquoteElements(children).slice(1)}</Callout>;
  },
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-lagos-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
  tr: ({ children }) => <tr className="even:bg-gray-50/50">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-lagos-800">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2 text-sm text-gray-700">{children}</td>,
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
