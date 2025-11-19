"use client";
import React, { useState, useEffect, useRef } from "react";

interface FloatingClientLogProps {
  log: string;
  targetId: string;
}

export const FloatingClientLog: React.FC<FloatingClientLogProps> = ({
  log,
  targetId,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Affiche le log flottant uniquement si on a scrolé en dessous du CodeBlock
        setIsVisible(entry.boundingClientRect.bottom < 0);
      },
      { root: null, threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  // scroll automatique vers le bas
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);

  if (!isVisible || !log) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.2rem",
        width: "100%",
      }}
    >
      {/* Titre petit et centré */}
      <div
        className="text-white font-semibold px-3 py-1 rounded-md"
        style={{
          backgroundColor: "rgba(55, 65, 81, 0.8)",
          display: "inline-block",
        }}
      >
        Client Log
      </div>

      {/* Conteneur de logs */}
      <div
        ref={logContainerRef}
        className="bg-gray-900 text-green-400 font-mono text-[9px] md:text-sm p-2 rounded-lg whitespace-pre-wrap overflow-y-auto"
        style={{
          maxHeight: "10em",
          width: "90%",
          maxWidth: "600px",
          position: "relative",
        }}
      >
        {log}
      </div>
    </div>
  );
};
