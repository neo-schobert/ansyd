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
  rttsRef?: React.RefObject<
    {
      sendTimestamp: number;
      receivedTimestamp: number;
      isLost: boolean;
      isSent: boolean;
    }[]
  >;
  language?: string;
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
  rttsRef,
  language = "",
}) => {
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  let [localLog, setLocalLog] = useState("");
  if (setLog) {
    [localLog, setLocalLog] = [log!, setLog];
  }
  const [showSnackbarOpenClient, setShowSnackbarOpenClient] = useState(false);
  const [showSnackbarOpenServer, setShowSnackbarOpenServer] = useState(false);
  const [loading, setLoading] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const TIMEOUT_TIME = 4000; // en ms
  const timeoutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const runningRef = useRef(false);
  useEffect(() => {
    runningRef.current = running;

    if (!running && timeoutIntervalRef.current) {
      clearInterval(timeoutIntervalRef.current);
      timeoutIntervalRef.current = null;
    }
    if (!running && statIntervalRef.current) {
      clearInterval(statIntervalRef.current);
      statIntervalRef.current = null;
    }
  }, [running]);

  const appendLog = (msg: string) =>
    setLocalLog((prev) => (prev ? prev + "\n" + msg : msg));

  const appendClientLog = (msg: string) => {
    if (
      isClientRunningRef &&
      isClientRunningRef?.current >= 0 &&
      setClientLogs &&
      isClientRunningRef?.current !== 5
    ) {
      setClientLogs[isClientRunningRef?.current]((prev) =>
        prev ? prev + "\n" + msg : msg
      );
    }
  };

  const calculateStats = () => {
    const arr = rttsRef?.current.filter((rtt) => rtt.isLost || rtt.isSent);
    if (!arr || arr.length === 0) {
      return {
        last: 0,
        average: 0,
        best: 0,
        worst: 0,
        stdev: 0,
        lossPercent: 0,
        sentCount: 0,
      };
    }

    let sum = 0;
    let best = Number.POSITIVE_INFINITY;
    let worst = 0;
    let last = 0;

    let sentCount = 0;
    let lostCount = 0;

    // on collecte tous les RTT (même ceux marqués lost) comme dans ta version simple
    const allRtts: number[] = [];

    for (const r of arr) {
      if (r.isSent) sentCount++;
      if (r.isLost) lostCount++;

      const d = r.receivedTimestamp - r.sendTimestamp;
      allRtts.push(d);
      sum += d;

      if (d < best) best = d;
      if (d > worst) worst = d;
    }

    // last = dernier élément du tableau (même logique que before)
    if (allRtts.length > 0) {
      last = allRtts[allRtts.length - 1];
    } else {
      best = 0;
    }

    // moyenne et stdev CALCULÉES COMME AVANT (division par arr.length)
    const average = sum / arr.length;

    let variance = 0;
    for (const v of allRtts) {
      variance += Math.pow(v - average, 2);
    }
    const stdev = Math.sqrt(variance / arr.length);

    const lossPercent = sentCount > 0 ? (lostCount / sentCount) * 100 : 0;

    return {
      last,
      average,
      best: best === Number.POSITIVE_INFINITY ? 0 : best,
      worst,
      stdev,
      lossPercent,
      sentCount,
    };
  };

  const treatMessageClient = (now: number) => {
    const arr = rttsRef?.current;
    if (!arr || arr.length === 0) return;

    const last = arr[arr.length - 1];

    const { average, stdev } = calculateStats();

    const elapsedMs = now - last.sendTimestamp;

    const elapsedSec = elapsedMs / 1000;

    const countLost = arr.reduce((acc, rtt) => acc + (rtt.isLost ? 1 : 0), 0);

    const countSent = arr.reduce((acc, rtt) => acc + (rtt.isSent ? 1 : 0), 0);

    switch (isClientRunningRef?.current) {
      case 0:
        return true;
      case 1:
        if (elapsedMs >= 5000) {
          // Affichage avec décimales comme Go
          appendClientLog(`ERROR: Response took too long: ${elapsedSec}s`);
        } else {
          appendClientLog(`Response took ${elapsedSec}s`);
        }
        return true;
      case 2:
        if (elapsedMs >= 5000) {
          // Affichage avec décimales comme Go
          appendClientLog(`ERROR: Response took too long: ${elapsedSec}s`);
        } else {
          appendClientLog(`Response took ${elapsedSec}s`);
        }

        appendClientLog(
          `Current RTT stats -> Average: ${average / 1000} s | StdDev: ${
            stdev / 1000
          } s`
        );

        return true;
      case 3:
        if (elapsedMs >= TIMEOUT_TIME) {
          return false;
        } else {
          appendClientLog(`Response took ${elapsedSec}s`);
          appendClientLog(
            `Current RTT stats -> Average: ${average / 1000} s | StdDev: ${
              stdev / 1000
            } s`
          );
          return true;
        }
      case 4:
        if (elapsedMs >= TIMEOUT_TIME) {
          return false;
        } else {
          appendClientLog(`Response took ${elapsedSec}s`);
          appendClientLog(
            `Current RTT stats -> Average: ${average / 1000} s | StdDev: ${
              stdev / 1000
            } s${
              countLost !== undefined &&
              countSent !== undefined &&
              countSent !== 0
                ? " | Loss: " + (countLost / countSent) * 100
                : countSent === 0
                ? " | Loss: +inf"
                : ""
            }`
          );
          return true;
        }
      case 5:
        if (elapsedMs >= TIMEOUT_TIME) {
          return false;
        } else {
          return true;
        }

      default:
        return true;
    }
  };

  const sendMsgClient = (now: number) => {
    if (!wsRef || !wsRef.current) return appendClientLog("❌ wsRef non défini");
    const ws = wsRef.current;

    if (ws.readyState === WebSocket.OPEN) {
      const continueSending = treatMessageClient(now);
      if (!continueSending) return;
      appendClientLog("Client Send: Hi UDP Server, How are you doing?");
      if (isClientRunningRef && isClientRunningRef?.current >= 0) {
        const now = Date.now();
        rttsRef?.current?.push({
          sendTimestamp: now,
          receivedTimestamp: 0,
          isLost: false,
          isSent: false,
        });
        ws.send("Hi UDP Server, How are you doing?|" + now);
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

    const lastClient = isClientRunningRef.current;
    isClientRunningRef.current = endpoint;

    setRunning(true);
    setLocalLog("");

    const sendMsg = () => {
      if (!wsRef || !wsRef.current) return appendLog("❌ wsRef non défini");
      const ws = wsRef.current;

      if (ws.readyState === WebSocket.OPEN) {
        const now = Date.now();
        appendLog("Client Send: Hi UDP Server, How are you doing?");
        rttsRef?.current?.push({
          sendTimestamp: now,
          receivedTimestamp: 0,
          isLost: false,
          isSent: false,
        });
        ws.send("Hi UDP Server, How are you doing?|" + now);

        if (endpoint < 3) return;
        const step = 10; // ms

        const interval = setInterval(() => {
          if (!runningRef.current) {
            // runningRef = ref miroir de ton state
            clearInterval(interval);
            timeoutIntervalRef.current = null;
            return;
          }
          const arr = rttsRef?.current;
          if (!arr || arr.length === 0) return;
          const now = Date.now();

          arr
            .filter((rtt) => rtt.receivedTimestamp === 0)
            .forEach((rtt) => {
              const elapsedMs = now - rtt.sendTimestamp;
              if (elapsedMs >= TIMEOUT_TIME) {
                rtt.receivedTimestamp = now;
                rtt.isLost = true;
                if (endpoint !== 5) {
                  appendLog(
                    "Packet lost or error: (took " + elapsedMs / 1000 + "s)"
                  );
                }

                const countLost = arr.reduce(
                  (acc, rtt) => acc + (rtt.isLost ? 1 : 0),
                  0
                );

                const countSent = arr.reduce(
                  (acc, rtt) => acc + (rtt.isSent ? 1 : 0),
                  0
                );

                const { average, stdev } = calculateStats();
                if (endpoint !== 5) {
                  appendLog(
                    `Current RTT stats -> Average: ${
                      average / 1000
                    } s | StdDev: ${stdev / 1000} s${
                      countLost !== undefined &&
                      countSent !== undefined &&
                      countSent !== 0
                        ? " | Loss: " +
                          (countLost / countSent) * 100 +
                          " | Sent: " +
                          countSent +
                          " | Lost: " +
                          countLost
                        : countSent === 0
                        ? " | Loss: +inf"
                        : ""
                    }`
                  );
                }

                setTimeout(() => {
                  if (wsRef && wsRef.current) {
                    const ws = wsRef.current;
                    if (ws.readyState === WebSocket.OPEN) {
                      appendLog(
                        "Client Send: Hi UDP Server, How are you doing?"
                      );

                      const now = Date.now();
                      rttsRef?.current?.push({
                        sendTimestamp: now,
                        receivedTimestamp: 0,
                        isLost: false,
                        isSent: false,
                      });
                      ws.send("Hi UDP Server, How are you doing?|" + now);
                    }
                  }
                }, 1000);
              }
            });
        }, step);

        timeoutIntervalRef.current = interval;

        if (endpoint < 5) return;
        const stepStat = 2000; // ms

        appendLog(
          `\n${"Host".padEnd(15)} | ${"Pkt: Loss%   Sent".padEnd(
            14
          )} | RTT: Last   Avg   Best   Wrst   StDev`
        );
        appendLog("-".repeat(80));
        const intervalStat = setInterval(() => {
          if (!runningRef.current) {
            // runningRef = ref miroir de ton state
            clearInterval(interval);
            timeoutIntervalRef.current = null;
            return;
          }

          const { average, stdev, last, best, worst, lossPercent, sentCount } =
            calculateStats();

          // helper pour arrondir comme round2()

          const line =
            `127.0.0.1:1234`.padEnd(15) +
            " |    " +
            `${lossPercent.toFixed(1)}%`.padStart(6) +
            ` ${String(sentCount).padStart(4)}    |     ` +
            `${(last / 1000).toFixed(1).padStart(5)} ` +
            `${(average / 1000).toFixed(1).padStart(5)} ` +
            `${(best / 1000).toFixed(1).padStart(6)} ` +
            `${(worst / 1000).toFixed(1).padStart(6)} ` +
            `${(stdev / 1000).toFixed(1).padStart(6)}`;
          appendLog(line);
        }, stepStat);

        statIntervalRef.current = intervalStat;
      }
    };

    if (lastClient < 0) {
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
  };

  const stopWebSocket = () => {
    if (!wsRef) return appendLog("❌ wsRef non défini");
    setRunning(false);
    if (isClientRunningRef && isClientRunningRef.current === endpoint) {
      isClientRunningRef.current = -1;
    }

    if (typeof endpoint === "number" && endpoint >= 3) {
      setLoading(7500);

      const step = 100; // ms
      let current = 7500;

      const interval = setInterval(() => {
        current -= step;
        setLoading(current);

        if (current <= 0) {
          clearInterval(interval);
          setLoading(0);
        }
      }, step);
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
        setLocalLog("");

        wsRef.current.send("start" + endpoint);
        if (!isClientRunningRef || isClientRunningRef.current < 0) {
          setShowSnackbarOpenClient(true);
        }
        setRunning(true);

        wsRef.current.onmessage = (event: MessageEvent) => {
          if (event.data.startsWith("Server Send: Hello UDP Client")) {
            appendLog("Server Send: Hello UDP Client");
            const now = Date.now();

            if (
              isClientRunningRef?.current &&
              isClientRunningRef?.current >= 3
            ) {
              const delay = event.data.split("|")[2];
              const start = event.data.split("|")[1];

              if (isClientRunningRef?.current >= 3 && delay <= TIMEOUT_TIME) {
                const arr = rttsRef?.current;
                if (!arr || arr.length === 0) return;

                const dedicatedMsg = arr.find(
                  (rtt) => rtt.sendTimestamp.toString() === start
                );
                if (dedicatedMsg) {
                  dedicatedMsg.receivedTimestamp = now;
                  dedicatedMsg.isSent = true;
                }

                setTimeout(() => {
                  sendMsgClient(now);
                }, 1000);
              }
            } else if (isClientRunningRef?.current === 2) {
              const arr = rttsRef?.current;
              if (!arr || arr.length === 0) return;

              const last = arr[arr.length - 1];
              last.receivedTimestamp = now;
              last.isSent = true;
              setTimeout(() => {
                sendMsgClient(now);
              }, 1000);
              return;
            } else {
              setTimeout(() => {
                sendMsgClient(now);
              }, 1000);
              return;
            }
          } else if (event.data.startsWith("Read a message from ")) {
            const parts = event.data.split("|");
            appendLog(parts[0]);
          } else {
            appendLog(event.data);
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
        className={`rounded-lg overflow-x-auto ${
          language ? language : "language-go"
        }`}
        tabIndex={0}
      >
        <code
          style={{
            fontSize: isMobile ? "0.7rem" : "1rem",
            lineHeight: "1.3",
          }}
          className={`${language ? language : "language-go"}`}
        >
          {children}
        </code>
      </pre>

      {wsRef && isClient && loading <= 0 && (
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
      {!isMobile && localLog && loading <= 0 && (
        <div
          ref={logContainerRef}
          className="mt-3 bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-[10px] md:text-sm whitespace-pre-wrap overflow-y-auto"
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
