"use client";
import React, { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-go";
import "prismjs/themes/prism-okaidia.css";

interface CodeBlockProps {
  children: string;
  endpoint?: string;
  wsRef?: React.RefObject<WebSocket | null>;
  isClient?: boolean; // true = client, false = server
}

interface LabResponse {
  stdout: string;
  stderr: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  endpoint,
  wsRef,
  isClient,
}) => {
  const [log, setLog] = useState<string>("");
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const isBrowser = typeof window !== "undefined";
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Prism.highlightAll();
  }, [children]);

  // Scroll automatique vers le bas à chaque nouveau log
  useEffect(() => {
    const container = logContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [log]);

  const appendLog = (msg: string) =>
    setLog((prev) => (prev ? prev + "\n" + msg : msg));

  const startWebSocketClient = () => {
    if (!wsRef) return appendLog("❌ wsRef non défini");
    if (!endpoint) return appendLog("❌ Endpoint non défini");
    setRunning(true);

    const ws = new WebSocket(endpoint);
    wsRef.current = ws;

    ws.onclose = () => appendLog("⚠️ WebSocket fermé");
    ws.onerror = () => appendLog("❌ Erreur WebSocket");

    // boucle toutes les secondes comme ton client UDP Go
    intervalRef.current = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // équivalent de fmt.Fprintf(conn, ...)
        appendLog("Client Send: " + "Hi UDP Server, How are you doing?");
        wsRef.current.send("Hi UDP Server, How are you doing?");
      }
    }, 1000);
  };

  const stopWebSocket = () => {
    if (!wsRef) return appendLog("❌ wsRef non défini");
    setRunning(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    appendLog("⏹ Client arrêté");
  };

  const handleExecute = () => {
    if (wsRef && isClient) {
      if (running) {
        stopWebSocket();
      } else {
        startWebSocketClient();
      }
    }
  };

  const handleExecuteServer = () => {
    if (wsRef?.current && !isClient) {
      if (running) {
        wsRef.current.send("stop" + endpoint);
        setRunning(false);
        wsRef.current.onmessage = () => {};
      } else {
        wsRef.current.send("start" + endpoint);
        setRunning(true);
        wsRef.current.onmessage = (event: MessageEvent) =>
          appendLog(event.data);
      }
    }
  };

  const handleExecuteHTTP = async () => {
    setLog("⏳ Exécution…");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s

    if (!endpoint) {
      setLog("❌ Endpoint non défini");
      return;
    }
    try {
      const res = await fetch(endpoint, { signal: controller.signal });
      const text = await res.text();
      clearTimeout(timeout);

      let data: LabResponse;
      try {
        data = JSON.parse(text);
      } catch {
        const safe = text.replace(/\r?\n/g, "\\n").replace(/\t/g, "\\t");
        data = JSON.parse(safe);
      }
      const output = data.stderr
        ? `${data.stdout}\n⚠️ Erreur : ${data.stderr}`
        : data.stdout;
      setLog(output.replace(/\\n/g, "\n").replace(/\\t/g, "\t"));
    } catch (err) {
      clearTimeout(timeout);
      setLog(`❌ Erreur : ${String(err)}`);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-xl shadow-md border border-gray-200">
      <pre
        className="rounded-lg overflow-x-auto text-sm language-go"
        tabIndex={0}
      >
        <code className="language-go">{children}</code>
      </pre>

      {wsRef && isClient && endpoint && (
        <button
          onClick={handleExecute}
          className={`mt-3 px-4 py-2 rounded-lg text-white transition ${
            running
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {running ? "Stopper le client" : "Démarrer le client"}
        </button>
      )}

      {wsRef && !isClient && endpoint && (
        <button
          onClick={handleExecuteServer}
          className={`mt-3 px-4 py-2 rounded-lg text-white transition ${
            running
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {running ? "Stopper le Serveur" : "Démarrer le Serveur"}
        </button>
      )}
      {!wsRef && endpoint && (
        <button
          onClick={handleExecuteHTTP}
          className="mt-3 px-4 py-2 bg-indigo-500 cursor-pointer text-white rounded-lg hover:bg-indigo-600 transition"
        >
          Exécuter le code
        </button>
      )}

      {isBrowser && log && endpoint && (
        <div
          ref={logContainerRef}
          className="mt-3 bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-y-auto"
          style={{ maxHeight: "300px" }}
        >
          {log.trim()}
        </div>
      )}
    </div>
  );
};
