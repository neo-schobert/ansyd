// app/lab4/page.tsx
"use client";
import { ArchitectureQ1 } from "@/components/Architecture";
import { ArchitectureQ2_1 } from "@/components/ArchitectureQ2_1";
import { ArchitectureQ2_2 } from "@/components/ArchitectureQ2_2";
import { CodeBlock } from "@/components/CodeBlock";
import { TextBlock } from "@/components/TextBlock";
import { useState } from "react";

const Lab4Page = () => {
  const [log1, setLog1] = useState("");
  const [log2, setLog2] = useState("");
  const [log3, setLog3] = useState("");
  const [running1, setRunning1] = useState(false);
  const [running2, setRunning2] = useState(false);
  const [running3, setRunning3] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-gray-100 to-gray-50 p-6 pt-40">
      <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
        Lab 4 — Broadcast and Gossip algorithms
      </h1>

      <div className="max-w-5xl mx-auto space-y-12">
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 1 — Broadcast et Workers concurrents
        </h2>
        <CodeBlock
          endpoint="https://go-backend-531057961347.europe-west1.run.app/lab4?fn=q1"
          log={log1}
          setLog={setLog1}
          running={running1}
          setRunning={setRunning1}
        >
          {`package main

import "fmt"

func main() {
    jobs := make(chan int, 5)
    done_1 := make(chan bool)
    done_2 := make(chan bool)

    go func() {
        for {
            j, more := <-jobs
            if more {
                fmt.Println("1 received job", j)
            } else {
                fmt.Println("1 received all jobs")
                done_1 <- true
                return
            }
        }
    }()

    go func() {
        for {
            j, more := <-jobs
            if more {
                fmt.Println("2 received job", j)
            } else {
                fmt.Println("2 received all jobs")
                done_2 <- true
                return
            }
        }
    }()

    for j := 1; j <= 3; j++ {
        jobs <- j
        fmt.Println("sent job", j)
    }
    close(jobs)
    fmt.Println("sent all jobs")

    <-done_1
    <-done_2
}`}
        </CodeBlock>
        <TextBlock>
          Trois goroutines tournent en même temps : la goroutine principale et
          les deux workers.
        </TextBlock>
        <TextBlock>
          Ci-dessous, on observer l&apos;architecture des goroutines.
        </TextBlock>
        <ArchitectureQ1 />
        <TextBlock>
          Les jobs sont répartis entre les deux workers. Un job ne peut être
          consommé qu&apos;une seule fois. Chaque worker prend ce qu&apos;il lit
          en premier, donc ils se partagent le flux.
        </TextBlock>
        <TextBlock>
          Sur ce backend Google Cloud exécuté dans un container Docker, on
          observe que le résultat est quasi déterministe : la goroutine 2 reçoit
          presque tous les jobs avant la 1. Après m&apos;être renseigné, cela
          s&apos;expliquerai par le scheduler Go combiné à la configuration du
          container (nombre de vCPUs limité, isolation du Docker), ce qui réduit
          la concurrence et l&apos;aléa dans l&apos;ordonnancement des
          goroutines par rapport à un PC local.
        </TextBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 2 — Architectures Alternatives
        </h2>

        <TextBlock>
          Pour que les deux workers reçoivent tous les jobs, on ajoute
          d&apos;abord une routine de broadcast. Cette routine lit les jobs
          depuis le canal principal et les distribue immédiatement à chaque
          worker au fur et à mesure qu&apos;elle les reçoit.
        </TextBlock>
        <ArchitectureQ2_1 />
        <CodeBlock
          endpoint="https://go-backend-531057961347.europe-west1.run.app/lab4?fn=q2_1"
          log={log2}
          setLog={setLog2}
          running={running2}
          setRunning={setRunning2}
        >
          {`package main

import "fmt"

func main() {
    jobs := make(chan int)
    done_1 := make(chan bool)
    done_2 := make(chan bool)

    // Canaux pour chaque worker
    worker1 := make(chan int)
    worker2 := make(chan int)

    // Broadcast routine
    go func() {
        for j := range jobs {
            // envoyer à chaque worker
            worker1 <- j
            worker2 <- j
        }
        close(worker1)
        close(worker2)
    }()

    // Worker 1
    go func() {
        for j := range worker1 {
            fmt.Println("1 received job", j)
        }
        fmt.Println("1 received all jobs")
        done_1 <- true
    }()

    // Worker 2
    go func() {
        for j := range worker2 {
            fmt.Println("2 received job", j)
        }
        fmt.Println("2 received all jobs")
        done_2 <- true
    }()

    // Envoyer les jobs dans le canal broadcast
    for j := 1; j <= 3; j++ {
        jobs <- j
        fmt.Println("sent job", j)
    }
    close(jobs)
    fmt.Println("sent all jobs")

    <-done_1
    <-done_2
}`}
        </CodeBlock>
        <TextBlock>
          Chaque job est dupliqué et envoyé dans les canaux spécifiques à chaque
          worker. Ainsi, chaque worker voit tous les jobs et aucun n&apos;est
          perdu.
        </TextBlock>
        <ArchitectureQ2_2 />
        <CodeBlock
          endpoint="https://go-backend-531057961347.europe-west1.run.app/lab4?fn=q2_2"
          log={log3}
          setLog={setLog3}
          running={running3}
          setRunning={setRunning3}
        >
          {`package main

import "fmt"

func main() {
    jobs1 := make(chan int, 3)
    jobs2 := make(chan int, 3)
    done_1 := make(chan bool)
    done_2 := make(chan bool)

    // Worker 1
    go func() {
        for j := range jobs1 {
            fmt.Println("1 received job", j)
        }
        fmt.Println("1 received all jobs")
        done_1 <- true
    }()

    // Worker 2
    go func() {
        for j := range jobs2 {
            fmt.Println("2 received job", j)
        }
        fmt.Println("2 received all jobs")
        done_2 <- true
    }()

    // Envoyer les jobs séparément
    for j := 1; j <= 3; j++ {
        jobs1 <- j
        jobs2 <- j
        fmt.Println("sent job", j, "to both channels")
    }

    close(jobs1)
    close(jobs2)
    fmt.Println("sent all jobs")

    <-done_1
    <-done_2
}`}
        </CodeBlock>
      </div>
    </div>
  );
};

export default Lab4Page;
