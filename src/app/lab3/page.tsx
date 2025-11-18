// app/lab3/page.tsx
"use client";

import { CodeBlock } from "@/components/CodeBlock";
import { TextBlock } from "@/components/TextBlock";
import { useRef } from "react";

const Lab3Page = () => {
  const wsRef = useRef<WebSocket | null>(null);

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

        {/* ---------------- Q1 ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 1 — Type et capacité du buffer
        </h2>
        <TextBlock>
          Je commence par observer la variable <code>p</code> qui stocke les
          données reçues depuis le serveur. Son type est <code>[]byte</code> et
          sa capacité est celle définie à sa création, par exemple{" "}
          <code>2048</code>.
        </TextBlock>

        {/* ---------------- Q2 ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 2 — Lecture UDP
        </h2>
        <TextBlock>
          La ligne <code>_, err = bufio.NewReader(conn).Read(p)</code> lit les
          données depuis le serveur. Je passe en paramètre le buffer{" "}
          <code>p</code> qui reçoit les octets. La fonction retourne le nombre
          d&apos;octets lus et une erreur éventuelle. En deux lignes, ça
          donnerait:
        </TextBlock>
        <CodeBlock>
          {`reader := bufio.NewReader(conn)
n, err := reader.Read(p)
`}
        </CodeBlock>

        {/* ---------------- Q3 ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 3 — Client UDP complet
        </h2>
        <TextBlock>
          Je crée un client qui se connecte au serveur UDP à l&apos;adresse{" "}
          <code>127.0.0.1:1234</code>. Il envoie un message toutes les secondes
          et lit la réponse. Les logs s&apos;affichent en direct via WebSocket.
        </TextBlock>
        <CodeBlock
          endpoint="wss://go-backend-531057961347.europe-west1.run.app/lab3/ws"
          wsRef={wsRef}
          isClient
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

        {/* ---------------- Q4 ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 4 — Send Response
        </h2>
        <CodeBlock>
          {`func sendResponse(conn *net.UDPConn, addr *net.UDPAddr) {
	_, err := conn.WriteToUDP([]byte("Hello UDP Client"), addr)
	if err != nil {
		fmt.Printf("Couldn't send response %v", err)
	}
}`}
        </CodeBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 5 — Serveur UDP complet
        </h2>

        <CodeBlock endpoint="serverq5" wsRef={wsRef} isClient={false}>
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
		sendResponse(ser, &addr)

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

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 6 — Listen UDP
        </h2>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 7 — Test Client - Server
        </h2>
      </div>
    </div>
  );
};

export default Lab3Page;
