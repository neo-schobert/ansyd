// app/lab3/page.tsx
"use client";

import { CodeBlock } from "@/components/CodeBlock";
import { FloatingClientLog } from "@/components/FloatingClientLog";
import { TextBlock } from "@/components/TextBlock";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
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
    {
      sendTimestamp: number;
      receivedTimestamp: number;
      isLost: boolean;
      isSent: boolean;
    }[]
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
  const [openWSStopSnackbar, setOpenWSStopSnackbar] = useState(false);
  const [openWSConnectSnackbar, setOpenWSConnectSnackbar] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(
        "wss://go-backend-531057961347.europe-west1.run.app/lab3/ws"
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setOpenWSConnectSnackbar(true);
        console.log("WebSocket connected");
      };

      ws.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        handleStopClients();
        handleStopServers();
        setOpenWSStopSnackbar(true);
        reconnectTimeout = setTimeout(connect, 2000); // reconnect après 2s
      };

      ws.onerror = () => {
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

        {runningClient3 && (
          <FloatingClientLog log={logClient3} targetId="client3" />
        )}

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

        {runningClient9 && (
          <FloatingClientLog log={logClient9} targetId="client9" />
        )}

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


    fmt.Printf("Current RTT stats -> Average: %v  s | StdDev: %v  s\\n\\n", avg, stdev)


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

        {runningClient10 && (
          <FloatingClientLog log={logClient10} targetId="client10" />
        )}

        <h2 className="text-xl font-semibold text-gray-800">
          Question 11 — Timeout Condition
        </h2>

        <TextBlock>
          Pour ajouter le timeout, on a juste comme prévu utilisé la méthode{" "}
          <code>SetReadDeadline</code> sur la connexion UDP avec un timeout de 4
          secondes avant la lecture. Ainsi, si la lecture dépasse ce délai, le
          paquet est considéré comme perdu et une erreur de timeout est
          renvoyée.
        </TextBlock>

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
  	conn.SetReadDeadline(time.Now().Add(4 * time.Second)) 
  	_, err = bufio.NewReader(conn).Read(p)  
  	// Mesure du temps écoulé
  	elapsed := time.Since(start)
  	rtts = append(rtts, elapsed)  
  	if err != nil {
  		// Timeout
  		fmt.Printf("Packet lost or error: %v (took %v s)\\n", err, elapsed.Seconds())
  	} else {
  		fmt.Printf("Response took %v s\\n", elapsed.Seconds())
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
  	fmt.Printf("Current RTT stats -> Average: %v  s | StdDev: %v  s\\n\\n", avg, stdev) 
  	time.Sleep(1 * time.Second)
  }
}
`}
        </CodeBlock>

        {runningClient11 && (
          <FloatingClientLog log={logClient11} targetId="client11" />
        )}

        <h2 className="text-xl font-semibold text-gray-800">
          Question 12 — Count Sent and Lost Packets
        </h2>

        <TextBlock>
          On peut compter les paquets envoyés et perdus en utilisant deux
          variables entières. À chaque envoi de message, on incrémente le
          compteur de paquets envoyés. Si une erreur de timeout se produit lors
          de la lecture, on incrémente le compteur de paquets perdus. On affiche
          ensuite ces compteurs avec les statistiques RTT.
        </TextBlock>

        <CodeBlock
          id="client12"
          endpoint={4}
          wsRef={wsRef}
          isClient
          log={logClient12}
          setLog={setLogClient12}
          isClientRunningRef={isClientRunningRef}
          running={runningClient12}
          setRunning={setRunningClient12}
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
  sentCount := 0
  lostCount := 0  
  for {
  	start := time.Now() 
  	// Envoyer le message
  	fmt.Fprintf(conn, "Hi UDP Server, How are you doing?")  
  	// Définir un timeout pour la lecture
  	conn.SetReadDeadline(time.Now().Add(4 * time.Second)) 
  	_, err = bufio.NewReader(conn).Read(p)  
  	// Mesure du temps écoulé
  	elapsed := time.Since(start)
  	rtts = append(rtts, elapsed)  
  	if err != nil {
  		// Timeout
      lostCount++
  		fmt.Printf("Packet lost or error: %v (took %v s)\\n", err, elapsed.Seconds())
  	} else {
      sentCount++
  		fmt.Printf("Response took %v s\\n", elapsed.Seconds())
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
    lossPercent := float64(lostCount) / float64(sentCount) * 100  
    fmt.Printf("Current RTT stats -> Average: %v s | StdDev: %v s | Loss: %v\\n\\n",avg, stdev, lossPercent)  
  	time.Sleep(1 * time.Second)
  }
}
`}
        </CodeBlock>

        {runningClient12 && (
          <FloatingClientLog log={logClient12} targetId="client12" />
        )}

        <h2 className="text-xl font-semibold text-gray-800">
          Question 13 — Periodic Statistics Output
        </h2>

        <TextBlock>
          On peut compter les paquets envoyés et perdus en utilisant deux
          variables entières. À chaque envoi de message, on incrémente le
          compteur de paquets envoyés. Si une erreur de timeout se produit lors
          de la lecture, on incrémente le compteur de paquets perdus. On affiche
          ensuite ces compteurs avec les statistiques RTT.
        </TextBlock>

        <CodeBlock
          id="client13"
          endpoint={5}
          wsRef={wsRef}
          isClient
          log={logClient13}
          setLog={setLogClient13}
          isClientRunningRef={isClientRunningRef}
          running={runningClient13}
          setRunning={setRunningClient13}
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

var (
	rtts      []float64
	sentCount int
	lostCount int
)


func printStats(serverAddr *net.UDPAddr) {
  // En-tête (une seule fois)
  fmt.Printf("\\n%-15s | %-14s | %-34s\\n", "Host", "Pkt: Loss%% Sent", "RTT: Last Avg Best Wrst StDev")
  fmt.Println(strings.Repeat("-", 70))  
  for {
  	time.Sleep(2 * time.Second) 
  	// Rien à afficher
  	if len(rtts) == 0 && sentCount == 0 {
  		continue
  	} 
  	// Calculs
  	var sum, best, worst float64
  	best = math.MaxFloat64
  	worst = 0
  	last := 0.0 
  	for _, r := range rtts {
  		sum += r
  		if r < best {
  			best = r
  		}
  		if r > worst {
  			worst = r
  		}
  	} 
  	if len(rtts) > 0 {
  		last = rtts[len(rtts)-1]
  	} 
  	avg := 0.0
  	variance := 0.0
  	if len(rtts) > 0 {
  		avg = sum / float64(len(rtts))
  		for _, r := range rtts {
  			variance += math.Pow(r-avg, 2)
  		}
  		variance /= float64(len(rtts))
  	} 
  	stdev := math.Sqrt(variance)  
  	lossPercent := 0.0
  	if sentCount > 0 {
  		lossPercent = float64(lostCount) / float64(sentCount) * 100
  	} 
  	// Affichage
  	fmt.Printf("%-15s | %5.1f%% %4d      | %5.1f %5.1f %5.1f %5.1f %5.1f\\n",
  		serverAddr.String(),
  		round2(lossPercent),
  		sentCount,
  		round2(last), round2(avg), round2(best), round2(worst), round2(stdev))
  }
}

func main() {
  p := make([]byte, 2048)
  conn, err := net.Dial("udp", "127.0.0.1:1234")
  if err != nil {
  	fmt.Printf("Some error %v\\n", err)
  	return
  }
  defer conn.Close()   
  go func() {
    for {
    	start := time.Now() 
    	// Envoyer le message
    	fmt.Fprintf(conn, "Hi UDP Server, How are you doing?")  
    	// Définir un timeout pour la lecture
    	conn.SetReadDeadline(time.Now().Add(4 * time.Second)) 
    	_, err = bufio.NewReader(conn).Read(p)  
    	// Mesure du temps écoulé
    	elapsed := time.Since(start)
    	rtts = append(rtts, elapsed)  
    	if err != nil {
    		// Timeout
        lostCount++
    		fmt.Printf("Packet lost or error: %v (took %v s)\\n", err, elapsed.Seconds())
    	} else {
        sentCount++
    		fmt.Printf("Response took %v s\\n", elapsed.Seconds())
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
      lossPercent := float64(lostCount) / float64(sentCount) * 100  
      fmt.Printf("Current RTT stats -> Average: %v s | StdDev: %v s | Loss: %v\\n\\n",avg, stdev, lossPercent)  
    	time.Sleep(1 * time.Second)
    }
  }()


	go printStats(serverAddr)

}
`}
        </CodeBlock>

        {runningClient13 && (
          <FloatingClientLog log={logClient13} targetId="client13" />
        )}
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

      <Snackbar
        variant="soft"
        color="success"
        open={openWSConnectSnackbar}
        onClose={() => {
          setOpenWSConnectSnackbar(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        startDecorator={<CheckCircleIcon />}
        autoHideDuration={3000}
        endDecorator={
          <Button
            onClick={() => {
              setOpenWSConnectSnackbar(false);
            }}
            size="sm"
            variant="soft"
            color="success"
          >
            Fermer
          </Button>
        }
      >
        ✅ WebSocket connecté au serveur.
      </Snackbar>
      <Snackbar
        variant="soft"
        color="danger"
        open={openWSStopSnackbar}
        onClose={() => {
          setOpenWSStopSnackbar(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        startDecorator={<ExclamationTriangleIcon />}
        autoHideDuration={3000}
        endDecorator={
          <Button
            onClick={() => {
              setOpenWSStopSnackbar(false);
            }}
            size="sm"
            variant="soft"
            color="danger"
          >
            Fermer
          </Button>
        }
      >
        ⚠️ WebSocket déconnecté du serveur. Tous les clients et serveurs ont été
        arrêtés.
      </Snackbar>
    </div>
  );
};

export default Lab3Page;
