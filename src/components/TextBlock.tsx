// components/TextBlock.tsx
import React, { ReactNode } from "react";

interface TextBlockProps {
  children: ReactNode;
}

export const TextBlock: React.FC<TextBlockProps> = ({ children }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <div className="text-gray-800 leading-relaxed">{children}</div>
    </div>
  );
};
