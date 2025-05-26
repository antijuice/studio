
"use client";

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
  text: string | undefined | null;
  className?: string;
}

const MathText: React.FC<MathTextProps> = ({ text, className }) => {
  if (text === undefined || text === null || text.trim() === '') {
    return null;
  }

  // Process block math first: $$...$$
  const blockParts = text.split(/\$\$(.*?)\$\$/g);

  const elements = blockParts.flatMap((blockPart, i) => {
    if (i % 2 === 1) { // This is a block math part
      return [<BlockMath key={`block-${i}`} math={blockPart} />];
    } else { // This is a text part (or contains inline math)
      // Process inline math: $...$
      const inlineParts = blockPart.split(/\$(.*?)\$/g);
      return inlineParts.map((inlinePart, j) => {
        if (j % 2 === 1) { // This is an inline math part
          return <InlineMath key={`inline-${i}-${j}`} math={inlinePart} />;
        } else { // This is a pure text part
          // Replace escaped dollar signs with actual dollar signs for display
          const unescapedText = inlinePart.replace(/\\\$/g, '$');
          return <span key={`text-${i}-${j}`}>{unescapedText}</span>;
        }
      });
    }
  });

  // Add overflow-x-auto to the root div to handle very wide math expressions
  // The `prose` class helps with text wrapping and styling.
  // `min-w-0` is added to ensure it behaves correctly within flex containers.
  return <div className={cn("overflow-x-auto min-w-0", className)}>{elements}</div>;
};

export { MathText };

