// app/lab3/page.tsx
"use client";

import { CodeBlock } from "@/components/CodeBlock";
import { TextBlock } from "@/components/TextBlock";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button, Snackbar } from "@mui/joy";
import { useEffect, useRef, useState } from "react";

const Lab3Page = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [log, setLog] = useState("");
  const [log1, setLog1] = useState("");
  const [log2, setLog2] = useState("");
  const [log3, setLog3] = useState("");
  const [log4, setLog4] = useState("");
  const [log5, setLog5] = useState("");
  const [log6, setLog6] = useState("");
  const [log7, setLog7] = useState("");
  const isClientRunningRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [running1, setRunning1] = useState(false);
  const [running2, setRunning2] = useState(false);
  const [running3, setRunning3] = useState(false);
  const [running4, setRunning4] = useState(false);
  const [running5, setRunning5] = useState(false);
  const [running6, setRunning6] = useState(false);
  const [running7, setRunning7] = useState(false);

  const [stopServersSnackBar, setStopServersSnackBar] = useState("");

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(
        "wss://go-backend-531057961347.europe-west1.run.app/lab3/ws"
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        reconnectTimeout = setTimeout(connect, 2000); // reconnect après 2s
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        ws.close(); // ferme pour déclencher onclose
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws.close();
    };
  }, []);

  const handleStopServers = () => {
    if (wsRef.current) {
      wsRef.current.send("stopAll");
      wsRef.current.onmessage = () => {};
    }
    const runningServers = [
      running1,
      running2,
      running3,
      running4,
      running5,
      running6,
      running7,
    ];
    const snackbarString = `Le${
      runningServers.filter((r) => r).length > 1 ? "s" : ""
    } serveur${runningServers.filter((r) => r).length > 1 ? "s" : ""} de${
      runningServers.filter((r) => r).length > 1
        ? "s questions"
        : " la question"
    } ${runningServers
      .filter((r) => r)
      .map((r, idx) => (idx === 0 ? "5" : `${idx + 7}`))
      .join(", ")} ${
      runningServers.filter((r) => r).length > 1 ? "ont" : "a"
    } été arrêté${runningServers.filter((r) => r).length > 1 ? "s" : ""}.`;

    if (runningServers.some((r) => r)) {
      setStopServersSnackBar(snackbarString);
    }
    setRunning1(false);
    setRunning2(false);
    setRunning3(false);
    setRunning4(false);
    setRunning5(false);
    setRunning6(false);
    setRunning7(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-gray-100 to-gray-50 p-6 pt-40">
      <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
        Lab 3 — Failure Detection
      </h1>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* ---------------- Introduction ---------------- */}
        <TextBlock>
          Dans ce TP, je crée un client UDP-like pour interagir avec un serveur.
          J&apos;envoie des messages toutes les secondes et je récupère les
          réponses en temps réel via WebSocket. Comme le navigateur ne peut pas
          utiliser UDP direct, j&apos;utilise WebSocket pour simuler.
        </TextBlock>

        <h2 className="text-2xl font-semibold text-gray-800">1 — UDP client</h2>

        {/* ---------------- Q1 ---------------- */}
        <h2 className="text-xl font-semibold text-gray-800">
          Question 1 — Type et capacité du buffer
        </h2>
        <TextBlock>
          Je commence par observer la variable <code>p</code> qui stocke les
          données reçues depuis le serveur. Son type est <code>[]byte</code> et
          sa capacité est celle définie à sa création, par exemple{" "}
          <code>2048</code>.
        </TextBlock>

        {/* ---------------- Q2 ---------------- */}
        <h2 className="text-xl font-semibold text-gray-800">
          Question 2 — Lecture UDP
        </h2>
        <TextBlock>
          La ligne <code>_, err = bufio.NewReader(conn).Read(p)</code> lit les
          données depuis le serveur. Je passe en paramètre le buffer{" "}
          <code>p</code> qui reçoit les octets. La fonction retourne le nombre
          d&apos;octets lus et une erreur éventuelle. En deux lignes, ça
          donnerait:
        </TextBlock>
        <CodeBlock running={false} setRunning={() => {}}>
          {`reader := bufio.NewReader(conn)
n, err := reader.Read(p)
`}
        </CodeBlock>

        {/* ---------------- Q3 ---------------- */}
        <h2 className="text-xl font-semibold text-gray-800">
          Question 3 — Client UDP complet
        </h2>
        <TextBlock>
          Je crée un client qui se connecte au serveur UDP à l&apos;adresse{" "}
          <code>127.0.0.1:1234</code>. Il envoie un message toutes les secondes
          et lit la réponse. Les logs s&apos;affichent en direct via WebSocket.
        </TextBlock>
        <CodeBlock
          id="client"
          wsRef={wsRef}
          isClient
          log={log}
          setLog={setLog}
          isClientRunningRef={isClientRunningRef}
          running={running}
          setRunning={setRunning}
          runningServers={[running1, running2]}
        >
          {`package main

import (
	"bufio"
	"fmt"
	"net"
	"time"
)

func main() {
	p := make([]byte, 2048)
	conn, err := net.Dial("udp", "127.0.0.1:1234")
	if err != nil {
		fmt.Printf("Some error %v ", err)
		return
	}
	for {
		fmt.Fprintf(conn, "Hi UDP Server, How are you doing?")
		_, err = bufio.NewReader(conn).Read(p)
		if err == nil {
			fmt.Printf("%s\\n", p)
		} else {
			fmt.Printf("Some error %v\\n", err)
		}
		time.Sleep(1 * time.Second)
	}
	conn.Close()
}`}
        </CodeBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          2 — UDP Server{" "}
        </h2>

        {/* ---------------- Q4 ---------------- */}
        <h2 className="text-xl font-semibold text-gray-800">
          Question 4 — Send Response
        </h2>
        <CodeBlock running={false} setRunning={() => {}}>
          {`func sendResponse(conn *net.UDPConn, addr *net.UDPAddr) {
	_, err := conn.WriteToUDP([]byte("Hello UDP Client"), addr)
	if err != nil {
		fmt.Printf("Couldn't send response %v", err)
	}
}`}
        </CodeBlock>

        <h2 className="text-xl font-semibold text-gray-800">
          Question 5 — Serveur UDP complet
        </h2>

        <CodeBlock
          endpoint="serverq5"
          wsRef={wsRef}
          isClient={false}
          log={log1}
          setLog={setLog1}
          setClientLog={setLog}
          isClientRunningRef={isClientRunningRef}
          running={running1}
          setRunning={setRunning1}
          handleStopServers={handleStopServers}
        >
          {`package main

import (
	"fmt"
	"net"
)

func sendResponse(conn *net.UDPConn, addr *net.UDPAddr) {
	_, err := conn.WriteToUDP([]byte("Hello UDP Client"), addr)
	if err != nil {
		fmt.Printf("Couldn't send response %v", err)
	}
}

func main() {
	p := make([]byte, 2048)
	addr := net.UDPAddr{
		Port: 1234,
		IP:   net.ParseIP("127.0.0.1"),
	}
	for {
		ser, err := net.ListenUDP("udp", &addr)
		if err != nil {
			fmt.Printf("Some error %v\\n", err)
			return
		}
		for {
			n, remoteaddr, err := ser.ReadFromUDP(p)
			fmt.Printf("Read a message from %v %s \\n", remoteaddr, p[:n])
			if err != nil {
				fmt.Printf("Some error %v\\n", err)
				continue
			}

			go sendResponse(ser, remoteaddr)
		}
	}
}`}
        </CodeBlock>

        <TextBlock>
          La première boucle est inutile, car le serveur UDP n’a besoin d’être
          ouvert qu’une seule fois. Une fois le socket créé avec{" "}
          <code>ListenUDP</code>, il reste actif en continu et peut traiter tous
          les messages entrants sans être recréé. Une seule ouverture suffit
          pour maintenir l’écoute et répondre aux clients. On peut donc
          simplifier le code ainsi:
        </TextBlock>

        <CodeBlock running={false} setRunning={() => {}}>
          {`package main

import (
	"fmt"
	"net"
)

func sendResponse(conn *net.UDPConn, addr *net.UDPAddr) {
	_, err := conn.WriteToUDP([]byte("Hello UDP Client"), addr)
	if err != nil {
		fmt.Printf("Couldn't send response %v", err)
	}
}

func main() {
	p := make([]byte, 2048)
	addr := net.UDPAddr{
		Port: 1234,
		IP:   net.ParseIP("127.0.0.1"),
	}
	ser, err := net.ListenUDP("udp", &addr)
	if err != nil {
		fmt.Printf("Some error %v\\n", err)
		return
	}
	for {
		n, remoteaddr, err := ser.ReadFromUDP(p)
		fmt.Printf("Read a message from %v %s \\n", remoteaddr, p[:n])
		if err != nil {
			fmt.Printf("Some error %v\\n", err)
			continue
		}
		go sendResponse(ser, remoteaddr)
		
	}
}`}
        </CodeBlock>

        <h2 className="text-xl font-semibold text-gray-800">
          Question 6 — Listen UDP
        </h2>

        <TextBlock>
          La fonction <code>net.ListenUDP()</code> sert à ouvrir un socket UDP
          et à le mettre en écoute sur une adresse précise. Une fois lancé, il
          reçoit tous les datagrammes envoyés à ce port sans établir de
          connexion persistante. Elle prend deux arguments : le protocole
          (souvent <code>&quot;udp&quot;</code>) et un pointeur vers une{" "}
          <code>net.UDPAddr</code> qui contient l’adresse IP et le port.
        </TextBlock>

        <h2 className="text-xl font-semibold text-gray-800">
          Question 7 — Test Client - Server
        </h2>

        <TextBlock>
          Une fois le client et le serveur lancés, j’observe un petit échange
          comme pour le ping pong: le client envoie son message en boucle, le
          serveur le capte, répond, et les logs se succèdent sans pause.
        </TextBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          3 — RTT Monitoring
        </h2>

        <h2 className="text-xl font-semibold text-gray-800">
          Question 8 — Random Delay
        </h2>

        <TextBlock>
          Il suffit ici de modifier notre routine sendResponse pour y ajouter un
          délai aléatoire avant d&apos;envoyer la réponse au client.
        </TextBlock>

        <CodeBlock
          endpoint="serverq8"
          wsRef={wsRef}
          isClient={false}
          log={log2}
          setLog={setLog2}
          setClientLog={setLog}
          isClientRunningRef={isClientRunningRef}
          running={running2}
          setRunning={setRunning2}
          handleStopServers={handleStopServers}
        >
          {`package main

import (
	"fmt"
	"math/rand"
	"net"
	"time"
)

func sendResponse(conn *net.UDPConn, addr *net.UDPAddr) {
	delay := rand.Intn(2000)
	fmt.Printf("Waiting %d ms before responding to %v\\n", delay, addr)

	time.Sleep(time.Duration(delay) * time.Millisecond)
	_, err := conn.WriteToUDP([]byte("Hello UDP Client"), addr)
	if err != nil {
		fmt.Printf("Couldn't send response %v", err)
	}
}

func main() {
	p := make([]byte, 2048)
	addr := net.UDPAddr{
		Port: 1234,
		IP:   net.ParseIP("127.0.0.1"),
	}
	ser, err := net.ListenUDP("udp", &addr)
	if err != nil {
		fmt.Printf("Some error %v\\n", err)
		return
	}
	for {
		n, remoteaddr, err := ser.ReadFromUDP(p)
		fmt.Printf("Read a message from %v %s \\n", remoteaddr, p[:n])
		if err != nil {
			fmt.Printf("Some error %v\\n", err)
			continue
		}
		go sendResponse(ser, remoteaddr)
	}
	
}`}
        </CodeBlock>

        <h2 className="text-xl font-semibold text-gray-800">
          Question 9 — Measure Connectivity RTT
        </h2>

        <TextBlock>
          On met cette fois ci un temps aléatoire entre 0 et 7000 ms pour tester
          les erreurs de timeout côté client. On utilise la fonction{" "}
          <code>time.Now()</code> avant de lancer le délai aléatoire puis on
          utilise la fonction <code>time.Since()</code> après l&apos;envoi de la
          réponse pour mesurer le temps écoulé. Si le temps écoulé dépasse 5
          secondes, on affiche un message d&apos;erreur.
        </TextBlock>

        <CodeBlock
          endpoint="serverq9"
          wsRef={wsRef}
          isClient={false}
          log={log3}
          setLog={setLog3}
          setClientLog={setLog}
          isClientRunningRef={isClientRunningRef}
          running={running3}
          setRunning={setRunning3}
          handleStopServers={handleStopServers}
        >
          {`package main

import (
	"fmt"
	"math/rand"
	"net"
	"time"
)

func sendResponse(conn *net.UDPConn, addr *net.UDPAddr, start time.Time) {
	// Délai aléatoire entre 0 et 7000 ms pour tester les erreurs
	delay := rand.Intn(7000)
	fmt.Printf("Waiting %d ms before responding to %v\\n", delay, addr)

	time.Sleep(time.Duration(delay) * time.Millisecond)

	_, err := conn.WriteToUDP([]byte("Hello UDP Client"), addr)
	if err != nil {
		fmt.Printf("Couldn't send response %v\\n", err)
		return
	}

	// Mesure du temps écoulé
	elapsed := time.Since(start)

	if elapsed > 5*time.Second {
		fmt.Printf("ERROR: Response to %v took too long: %v\\n", addr, elapsed)
	} else {
		fmt.Printf("Response to %v took %v\\n", addr, elapsed)
	}
}

func main() {

	p := make([]byte, 2048)
	addr := net.UDPAddr{
		Port: 1234,
		IP:   net.ParseIP("127.0.0.1"),
	}

	ser, err := net.ListenUDP("udp", &addr)
	if err != nil {
		fmt.Printf("Some error %v\\n", err)
		return
	}

	for {
		n, remoteaddr, err := ser.ReadFromUDP(p)
		if err != nil {
			fmt.Printf("Read error %v\\n", err)
			continue
		}

		fmt.Printf("Received from %v: %s\\n", remoteaddr, string(p[:n]))

		// Enregistre le moment où la requête arrive
		start := time.Now()

		// Lance la réponse asynchrone avec la mesure du temps
		go sendResponse(ser, remoteaddr, start)
	}
}`}
        </CodeBlock>
      </div>
      <Snackbar
        variant="soft"
        color="danger"
        open={stopServersSnackBar !== ""}
        onClose={() => {
          setStopServersSnackBar("");
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        startDecorator={<ExclamationTriangleIcon />}
        autoHideDuration={3000}
        endDecorator={
          <Button
            onClick={() => {
              setStopServersSnackBar("");
            }}
            size="sm"
            variant="soft"
            color="danger"
          >
            Fermer
          </Button>
        }
      >
        ⚠️ {stopServersSnackBar}
      </Snackbar>
    </div>
  );
};

export default Lab3Page;
