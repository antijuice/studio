
"use client";

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { cn } from "@/lib/utils";

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

  // min-w-0 is important for flex containers to allow wrapping/shrinking.
  // Removed overflow-x-auto to prevent internal scrollbars.
  // Text wrapping is handled by default by block/inline elements.
  return <div className={cn("min-w-0", className)}>{elements}</div>;
};

export { MathText };
