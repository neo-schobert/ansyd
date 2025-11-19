// app/lab3/page.tsx
"use client";

import { CodeBlock } from "@/components/CodeBlock";
import { FloatingClientLog } from "@/components/FloatingClientLog";
import { TextBlock } from "@/components/TextBlock";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button, Snackbar } from "@mui/joy";
import { useEffect, useRef, useState } from "react";

const Lab3Page = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [logClient3, setLogClient3] = useState("");
  const [logServer5, setLogServer5] = useState("");
  const [logServer8, setLogServer8] = useState("");
  const [logClient9, setLogClient9] = useState("");
  const [logClient10, setLogClient10] = useState("");
  const [logClient11, setLogClient11] = useState("");
  const [logClient12, setLogClient12] = useState("");
  const [logClient13, setLogClient13] = useState("");
  const isClientRunningRef = useRef(-1);
  const rttsRef = useRef<
    { sendTimestamp: number; receivedTimestamp: number }[]
  >([]);

  const [runningClient3, setRunningClient3] = useState(false);
  const [runningServer5, setRunningServer5] = useState(false);
  const [runningServer8, setRunningServer8] = useState(false);
  const [runningClient9, setRunningClient9] = useState(false);
  const [runningClient10, setRunningClient10] = useState(false);
  const [runningClient11, setRunningClient11] = useState(false);
  const [runningClient12, setRunningClient12] = useState(false);
  const [runningClient13, setRunningClient13] = useState(false);

  const [stopServersSnackBar, setStopServersSnackBar] = useState("");
  const [stopClientsSnackBar, setStopClientsSnackBar] = useState("");

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

      ws.onerror = (_) => {
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
      wsRef.current.send("stopAllServers");
      wsRef.current.onmessage = () => {};
    }
    rttsRef.current = [];
    const runningServers = [runningServer5, runningServer8];
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
    setRunningServer5(false);
    setRunningServer8(false);
  };

  const handleStopClients = () => {
    const runningClients = [
      runningClient3,
      runningClient9,
      runningClient10,
      runningClient11,
      runningClient12,
      runningClient13,
    ];
    rttsRef.current = [];

    const snackbarString = `Le${
      runningClients.filter((r) => r).length > 1 ? "s" : ""
    } client${runningClients.filter((r) => r).length > 1 ? "s" : ""} de${
      runningClients.filter((r) => r).length > 1
        ? "s questions"
        : " la question"
    } ${runningClients
      .filter((r) => r)
      .map((r, idx) => (idx === 0 ? "3" : `${idx + 8}`))
      .join(", ")} ${
      runningClients.filter((r) => r).length > 1 ? "ont" : "a"
    } été arrêté${runningClients.filter((r) => r).length > 1 ? "s" : ""}.`;

    if (runningClients.some((r) => r)) {
      setStopClientsSnackBar(snackbarString);
    }
    setRunningClient3(false);
    setRunningClient9(false);
    setRunningClient10(false);
    setRunningClient11(false);
    setRunningClient12(false);
    setRunningClient13(false);
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
          id="client3"
          wsRef={wsRef}
          endpoint={0}
          isClient
          log={logClient3}
          setLog={setLogClient3}
          isClientRunningRef={isClientRunningRef}
          running={runningClient3}
          setRunning={setRunningClient3}
          runningServers={[runningServer5, runningServer8]}
          handleStopServers={handleStopClients}
          rttsRef={rttsRef}
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

        <FloatingClientLog log={logClient3} targetId="client" />

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
          log={logServer5}
          setLog={setLogServer5}
          setClientLogs={[
            setLogClient3,
            setLogClient9,
            setLogClient10,
            setLogClient11,
            setLogClient12,
            setLogClient13,
          ]}
          isClientRunningRef={isClientRunningRef}
          running={runningServer5}
          setRunning={setRunningServer5}
          handleStopServers={handleStopServers}
          rttsRef={rttsRef}
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
          log={logServer8}
          setLog={setLogServer8}
          setClientLogs={[
            setLogClient3,
            setLogClient9,
            setLogClient10,
            setLogClient11,
            setLogClient12,
            setLogClient13,
          ]}
          isClientRunningRef={isClientRunningRef}
          running={runningServer8}
          setRunning={setRunningServer8}
          handleStopServers={handleStopServers}
          rttsRef={rttsRef}
        >
          {`package main

import (
	"fmt"
	"math/rand"
	"net"
	"time"
)

func sendResponse(conn *net.UDPConn, addr *net.UDPAddr) {
	delay := rand.Intn(7000)
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

        <FloatingClientLog log={logClient9} targetId="client" />

        <h2 className="text-xl font-semibold text-gray-800">
          Question 9 — Measure Connectivity RTT
        </h2>

        <TextBlock>
          On utilise la fonction <code>time.Now()</code> avant d&apos;envoyer le
          message au server puis on utilise la fonction{" "}
          <code>time.Since()</code> une fois la réception du message du server.
          Si le temps écoulé dépasse 5 secondes, on affiche un message
          d&apos;erreur.
        </TextBlock>

        <CodeBlock
          id="client9"
          endpoint={1}
          wsRef={wsRef}
          isClient
          log={logClient9}
          setLog={setLogClient9}
          isClientRunningRef={isClientRunningRef}
          running={runningClient9}
          setRunning={setRunningClient9}
          runningServers={[runningServer5, runningServer8]}
          handleStopServers={handleStopClients}
          rttsRef={rttsRef}
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
    start := time.Now()

    fmt.Fprintf(conn, "Hi UDP Server, How are you doing?")
    _, err = bufio.NewReader(conn).Read(p) 

    // Mesure du temps écoulé
    elapsed := time.Since(start)  
    if elapsed > 5*time.Second {
      fmt.Printf("ERROR: Response took too long: %v\\n", elapsed)
    } else {
      fmt.Printf("Response took %v\\n", elapsed)
    }

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

        <FloatingClientLog log={logClient9} targetId="client" />

        <h2 className="text-xl font-semibold text-gray-800">
          Question 10 — Store RTT Measurements
        </h2>

        <TextBlock>
          On ajoute ici une slice globale pour stocker tous les RTTs et on
          calcule la moyenne et l&apos;écart-type après chaque nouveau RTT.
        </TextBlock>

        <CodeBlock
          id="client10"
          endpoint={2}
          wsRef={wsRef}
          isClient
          log={logClient10}
          setLog={setLogClient10}
          isClientRunningRef={isClientRunningRef}
          running={runningClient10}
          setRunning={setRunningClient10}
          runningServers={[runningServer5, runningServer8]}
          handleStopServers={handleStopClients}
          rttsRef={rttsRef}
        >
          {`package main

import (
  "bufio"
  "math"
  "fmt"
  "net"
  "time"
)

var rtts []time.Duration // Slice globale pour stocker tous les RTTs


func main() {
  p := make([]byte, 2048)
  conn, err := net.Dial("udp", "127.0.0.1:1234")
  if err != nil {
  	fmt.Printf("Some error %v ", err)
  	return
  }
  for {
    start := time.Now()

    fmt.Fprintf(conn, "Hi UDP Server, How are you doing?")
    _, err = bufio.NewReader(conn).Read(p) 

    // Mesure du temps écoulé
    elapsed := time.Since(start).Seconds() // en secondes
    
    // Stocker dans la slice
    rtts = append(rtts, elapsed)

    if elapsed > 5*time.Second {
      fmt.Printf("ERROR: Response took too long: %v\\n", elapsed)
    } else {
      fmt.Printf("Response took %v\\n", elapsed)
    }

    
	  // Calculer la moyenne et l'écart-type après chaque nouveau RTT
    var sum float64
    for _, rtt := range rtts {
      sum += float64(rtt) / 1e9
    }
    avg := sum / float64(len(rtts))

    variance := 0.0
    for _, rtt := range rtts {
      variance += math.Pow(float64(rtt)/1e9 - avg, 2)
    }
    stdev := math.Sqrt(variance / float64(len(rtts)))


    fmt.Printf("Current RTT stats -> Average: %.3f s | StdDev: %.3f s\\n\\n", avg, stdev)


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

        <FloatingClientLog log={logClient10} targetId="client" />

        <h2 className="text-xl font-semibold text-gray-800">
          Question 11 — Timeout Condition
        </h2>

        <TextBlock>h</TextBlock>

        <CodeBlock
          id="client11"
          endpoint={3}
          wsRef={wsRef}
          isClient
          log={logClient11}
          setLog={setLogClient11}
          isClientRunningRef={isClientRunningRef}
          running={runningClient11}
          setRunning={setRunningClient11}
          runningServers={[runningServer5, runningServer8]}
          handleStopServers={handleStopClients}
          rttsRef={rttsRef}
        >
          {`package main

import (
	"bufio"
	"fmt"
	"math"
	"net"
	"time"
)

var rtts []time.Duration // Slice globale pour stocker tous les RTTs

func main() {
	p := make([]byte, 2048)
	conn, err := net.Dial("udp", "127.0.0.1:1234")
	if err != nil {
		fmt.Printf("Some error %v\\n", err)
		return
	}
	defer conn.Close()

	for {
		start := time.Now()

		// Envoyer le message
		fmt.Fprintf(conn, "Hi UDP Server, How are you doing?")

		// Définir un timeout pour la lecture
		conn.SetReadDeadline(time.Now().Add(1 * time.Second))

		_, err = bufio.NewReader(conn).Read(p)

		// Mesure du temps écoulé
		elapsed := time.Since(start)
		rtts = append(rtts, elapsed)

		if err != nil {
			// Timeout
			fmt.Printf("Packet lost or error: %v (took %.3fs)\\n", err, elapsed.Seconds())
		} else {
			fmt.Printf("Response took %.3fs\\n", elapsed.Seconds())
		}

		// Calcul de la moyenne et de l'écart-type
		var sum float64
		for _, rtt := range rtts {
			sum += rtt.Seconds()
		}
		avg := sum / float64(len(rtts))

		var variance float64
		for _, rtt := range rtts {
			variance += math.Pow(rtt.Seconds()-avg, 2)
		}
		stdev := math.Sqrt(variance / float64(len(rtts)))

		fmt.Printf("Current RTT stats -> Average: %.3f s | StdDev: %.3f s\\n\\n", avg, stdev)

		time.Sleep(1 * time.Second)
	}
}
`}
        </CodeBlock>

        <FloatingClientLog log={logClient11} targetId="client" />
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
      <Snackbar
        variant="soft"
        color="danger"
        open={stopClientsSnackBar !== ""}
        onClose={() => {
          setStopClientsSnackBar("");
        }}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        startDecorator={<ExclamationTriangleIcon />}
        autoHideDuration={3000}
        endDecorator={
          <Button
            onClick={() => {
              setStopClientsSnackBar("");
            }}
            size="sm"
            variant="soft"
            color="danger"
          >
            Fermer
          </Button>
        }
      >
        ⚠️ {stopClientsSnackBar}
      </Snackbar>
    </div>
  );
};

export default Lab3Page;
