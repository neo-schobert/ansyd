"use client";
import React, { useState, useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-go";
import "prismjs/themes/prism-okaidia.css";
import { Button, CircularProgress, Snackbar } from "@mui/joy";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface CodeBlockProps {
  id?: string;
  children: string;
  endpoint?: string | number;
  wsRef?: React.RefObject<WebSocket | null>;
  isClient?: boolean; // true = client, false = server
  log?: string;
  setLog?: React.Dispatch<React.SetStateAction<string>>;
  setClientLogs?: React.Dispatch<React.SetStateAction<string>>[];
  isClientRunningRef?: React.RefObject<number>;
  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  handleStopServers?: () => void;
  runningServers?: boolean[];
}

interface LabResponse {
  stdout: string;
  stderr: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  id,
  children,
  endpoint,
  wsRef,
  isClient,
  log,
  setLog,
  setClientLogs,
  isClientRunningRef,
  running,
  setRunning,
  handleStopServers,
  runningServers,
}) => {
  const isBrowser = typeof window !== "undefined";
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  let [localLog, setLocalLog] = useState("");
  if (setLog) {
    [localLog, setLocalLog] = [log!, setLog];
  }
  const [showSnackbarOpenClient, setShowSnackbarOpenClient] = useState(false);
  const [showSnackbarOpenServer, setShowSnackbarOpenServer] = useState(false);
  const [loading, setLoading] = useState(0);

  useEffect(() => {
    Prism.highlightAll();
  }, [children]);

  // Scroll automatique vers le bas à chaque nouveau log
  useEffect(() => {
    const container = logContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [localLog]);

  const appendLog = (msg: string) =>
    setLocalLog((prev) => (prev ? prev + "\n" + msg : msg));

  const appendClientLog = (msg: string) => {
    if (
      isClientRunningRef &&
      isClientRunningRef?.current >= 0 &&
      setClientLogs &&
      setClientLogs[isClientRunningRef?.current]
    ) {
      setClientLogs[isClientRunningRef?.current]((prev) =>
        prev ? prev + "\n" + msg : msg
      );
    }
  };

  const sendMsgClient = () => {
    if (!wsRef || !wsRef.current) return appendClientLog("❌ wsRef non défini");
    const ws = wsRef.current;

    if (ws.readyState === WebSocket.OPEN) {
      appendClientLog("Client Send: Hi UDP Server, How are you doing?");
      if (isClientRunningRef && isClientRunningRef?.current >= 0) {
        ws.send("Hi UDP Server, How are you doing?");
      }
    }
  };

  const startWebSocketClient = () => {
    if (
      !wsRef ||
      !wsRef.current ||
      !isClientRunningRef ||
      typeof endpoint !== "number"
    )
      return appendLog("❌ wsRef non défini");

    handleStopServers?.();
    if (runningServers?.every((r) => !r)) {
      setShowSnackbarOpenServer(true);
    }

    setRunning(true);

    const sendMsg = () => {
      if (!wsRef || !wsRef.current) return appendLog("❌ wsRef non défini");
      const ws = wsRef.current;

      if (ws.readyState === WebSocket.OPEN) {
        appendLog("Client Send: Hi UDP Server, How are you doing?");
        ws.send("Hi UDP Server, How are you doing?");
      }
    };

    if (isClientRunningRef.current < 0) {
      sendMsg();
    } else {
      setLoading(7500);

      const step = 100; // ms
      let current = 7500;

      const interval = setInterval(() => {
        current -= step;
        setLoading(current);

        if (current <= 0) {
          clearInterval(interval);
          setLoading(0);
          sendMsg();
        }
      }, step);
    }

    isClientRunningRef.current = endpoint;
  };

  const stopWebSocket = () => {
    if (!wsRef) return appendLog("❌ wsRef non défini");
    setRunning(false);
    if (isClientRunningRef && isClientRunningRef.current === endpoint) {
      isClientRunningRef.current = -1;
    }
    setTimeout(() => {
      appendLog("⏹ Client arrêté");
    }, 1000);
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
        if (handleStopServers) handleStopServers();
        wsRef.current.send("start" + endpoint);
        if (!isClientRunningRef || isClientRunningRef.current < 0) {
          setShowSnackbarOpenClient(true);
        }
        setRunning(true);
        wsRef.current.onmessage = (event: MessageEvent) => {
          if (event.data.startsWith("Server reply: ")) {
            appendLog(event.data);
          } else {
            appendLog(event.data);
            setTimeout(() => {
              if (event.data === "Server Send: Hello UDP Client")
                sendMsgClient();
            }, 1000);
          }
        };
      }
    }
  };

  const handleExecuteHTTP = async () => {
    setLocalLog("⏳ Exécution…");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s

    if (!endpoint || typeof endpoint !== "string") {
      setLocalLog("❌ Endpoint non défini");
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
      setLocalLog(output.replace(/\\n/g, "\n").replace(/\\t/g, "\t"));
    } catch (err) {
      clearTimeout(timeout);
      setLocalLog(`❌ Erreur : ${String(err)}`);
    }
  };

  const smoothScrollTo = (targetPosition: number, duration: number) => {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);

      // Continuer l'animation tant que la durée n'est pas atteinte
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        // Réactiver le défilement une fois l'animation terminée
        document.body.style.overflow = "";
      }
    };

    requestAnimationFrame(animation);
  };

  // Fonction de timing pour lisser l'animation
  const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  };

  return (
    <div
      id={id ? id : undefined}
      className="bg-gray-50 p-4 rounded-xl shadow-md border border-gray-200"
    >
      <pre
        className="rounded-lg overflow-x-auto text-sm language-go"
        tabIndex={0}
      >
        <code className="language-go">{children}</code>
      </pre>

      {wsRef && isClient && (
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

      {loading > 0 && (
        <div className="mt-3 text-gray-600 font-medium flex items-center gap-2">
          <CircularProgress /> Chargement en cours... ({loading} ms restante)
        </div>
      )}
      {isBrowser && localLog && loading <= 0 && (
        <div
          ref={logContainerRef}
          className="mt-3 bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-y-auto"
          style={{ maxHeight: "300px" }}
        >
          {localLog.trim()}
        </div>
      )}
      <Snackbar
        variant="soft"
        color="warning"
        open={showSnackbarOpenClient}
        onClose={() => {
          setShowSnackbarOpenClient(false);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        startDecorator={<ExclamationTriangleIcon />}
        autoHideDuration={3000}
        endDecorator={
          <Button
            onClick={() => {
              setShowSnackbarOpenClient(false);
              const client = document.getElementById("client");
              if (client) {
                // Désactiver le défilement manuel
                const offset = 100; // Ajuste cette valeur selon tes besoins
                const targetPosition = client.offsetTop - offset;
                document.body.style.overflow = "hidden";
                smoothScrollTo(targetPosition, 2000); // Défilement sur 1 seconde
              }
            }}
            size="sm"
            variant="soft"
            color="warning"
          >
            Ouvir le Client
          </Button>
        }
      >
        ⚠️ Assurez-vous que le client UDP est démarré pour recevoir les messages
        du serveur.
      </Snackbar>
      <Snackbar
        variant="soft"
        color="warning"
        open={showSnackbarOpenServer}
        onClose={() => {
          setShowSnackbarOpenServer(false);
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        startDecorator={<ExclamationTriangleIcon />}
        autoHideDuration={3000}
        endDecorator={
          <Button
            onClick={() => {
              setShowSnackbarOpenServer(false);
            }}
            size="sm"
            variant="soft"
            color="warning"
          >
            Fermer
          </Button>
        }
      >
        ⚠️ Vous devriez d&apos;abord démarrer un server pour que le message du
        client soit écouté.
      </Snackbar>
    </div>
  );
};
