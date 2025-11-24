// app/lab4/page.tsx
"use client";
import { ArchitectureQ1 } from "@/components/Architecture";
import { ArchitectureQ2_1 } from "@/components/ArchitectureQ2_1";
import { ArchitectureQ2_2 } from "@/components/ArchitectureQ2_2";
import ArchitectureQ3 from "@/components/ArchitectureQ3";
import { CodeBlock } from "@/components/CodeBlock";
import { TextBlock } from "@/components/TextBlock";
import { useState } from "react";

const Lab4Page = () => {
  const [log1, setLog1] = useState("");
  const [log2, setLog2] = useState("");
  const [log3, setLog3] = useState("");
  const [log4, setLog4] = useState("");
  const [log5, setLog5] = useState("");
  const [log6, setLog6] = useState("");
  const [log7, setLog7] = useState("");
  const [running1, setRunning1] = useState(false);
  const [running2, setRunning2] = useState(false);
  const [running3, setRunning3] = useState(false);
  const [running4, setRunning4] = useState(false);
  const [running5, setRunning5] = useState(false);
  const [running6, setRunning6] = useState(false);
  const [running7, setRunning7] = useState(false);
  const [count, setCount] = useState(2);

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
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 3 — Failure Detection
        </h2>

        <TextBlock>
          On a deux routines : la goroutine principale qui envoie des jobs au
          worker (Node1). Ils sont symbolisés ici par deux noeuds. Pour
          implémenter le failure detector, on ajoute deux channels
          supplémentaires entre les deux noeuds pour les heartbeats et les
          réponses. Ces channels sont symbolisés par des edges entre nos deux
          noeuds. Periodiquement, le noeud principal envoie une requête de
          heartbeat au worker, il y répond alors avec un délai de plus en plus
          élevé pour simuler un ralentissement progressif. Si la réponse
          n&apos;est pas reçue dans le délai imparti (configurable ci-dessous),
          le worker est considéré comme défaillant et la routine principale
          arrête d&apos;envoyer des jobs.
        </TextBlock>

        <ArchitectureQ3 count={count} />

        <TextBlock>
          Le délai d&apos;attente pour la réponse du heartbeat peut être ajusté
          ci-dessous :
        </TextBlock>
        <h1 className="text-gray-800 justify-center flex items-center gap-3">
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            max={10}
            min={1}
            step={1}
            className="border border-gray-300 rounded px-2 py-1 w-20 text-black"
          />
          <p className="text-gray-800">secondes</p>
        </h1>
        <CodeBlock
          endpoint={`https://go-backend-531057961347.europe-west1.run.app/lab4?fn=q3&cnt=${count}`}
          log={log4}
          setLog={setLog4}
          running={running4}
          setRunning={setRunning4}
        >
          {`package main

import (
	"fmt"
	"time"
)

func main() {

	jobs_1 := make(chan int, 5)
	heartbeat := make(chan int)   // channel for heartbeat requests
	heartbeatReply := make(chan int) // channel for heartbeat replies

	done := make(chan bool)

	// Worker goroutine
	go func() {
		i := 1
		for {
			select {
			case j, more := <-jobs_1:
				if more {
					fmt.Println("Node 1 received job", j)
				} else {
					fmt.Println("Node 1 received all jobs")
					done <- true
					return
				}

			case hb, more := <-heartbeat:
				if more {
					fmt.Println("Node 1 received the heartbeat", hb)

					// simulate slow-down / failure
					time.Sleep(time.Duration(i) * time.Second)
					i++

					// reply to main
					heartbeatReply <- hb
				} else {
					fmt.Println("I'm not receiving jobs")
					done <- true
					return
				}
			}
		}
	}()

	// MAIN GOROUTINE
	for j := 1; j <= 10; j++ {

		if j%2 == 1 {
			// Normal job
			jobs_1 <- j
			fmt.Println("sent job", j)

		} else {
			// HEARTBEAT REQUEST
			fmt.Println("sent heartbeat", j)
			heartbeat <- j

			// FAILURE DETECTOR
			select {
			case <-heartbeatReply:
				fmt.Println("received heartbeat reply", j)

			case <-time.After(${count} * time.Second):
				fmt.Println("FAILURE DETECTED: worker too slow")
				close(jobs_1)
				close(heartbeat)
				close(heartbeatReply)
				return
			}
		}
	}

	close(jobs_1)
	fmt.Println("sent all jobs")

	<-done
}`}
        </CodeBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 4 — Cas n noeuds
        </h2>

        <TextBlock>
          Pour que node i puisse communiquer vers node j, il faut un canal de
          jobs un canal de heartbeat et un canal de heartbeat reply. La
          communication devant être asymétrique, il nous faut dupliquer tout
          cela. Il nous faut donc 2 canaux de jobs, 2 canaux de heartbeat et 2
          canaux de heartbeat reply pour que les deux nodes puissent communiquer
          entre eux. Chaque node aura une goroutine qui écoutera les jobs et les
          heartbeats entrants, et une autre goroutine dans la routine principale
          qui enverra les jobs et les heartbeats. Le failure detector sera
          également implémenté dans la routine principale pour chaque node,
          surveillant les réponses aux heartbeats. Ainsi, chaque node pourra
          envoyer et recevoir des jobs et des heartbeats de manière
          indépendante, tout en détectant les défaillances de l&apos;autre node.
        </TextBlock>

        <CodeBlock
          log={log5}
          setLog={setLog5}
          running={running5}
          setRunning={setRunning5}
        >
          {`
type Communications struct {
    Jobs_ij chan int
    Jobs_ji chan int
    Heartbeat_ij chan int
    Heartbeat_ji chan int
    HeartbeatReply_ij chan int
    HeartbeatReply_ji chan int
}`}
        </CodeBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 5 — sending_job et handling_jobs
        </h2>

        <CodeBlock
          log={log6}
          setLog={setLog6}
          running={running6}
          setRunning={setRunning6}
        >
          {`
func sending_job(id int, interarrival_time int, Jobs_Sent chan int) {
	jobID := 1

	for {
		Jobs_Sent <- jobID
		fmt.Printf("node %d → sent job %d\\n", id, jobID)

		jobID++
		time.Sleep(time.Duration(interarrival_time) * time.Second)
	}
}


func handling_jobs(id int, Jobs_Received chan int) {
	for job := range Jobs_Received {
		fmt.Printf("node %d → received job %d (discarded)\\n", id, job)
	}
}`}
        </CodeBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 6 — Heartbeat
        </h2>

        <CodeBlock
          log={log7}
          setLog={setLog7}
          running={running7}
          setRunning={setRunning7}
        >
          {`
func answering_heartbeat(id int, Heartbeat_Received chan int, ACK_Sent chan int) {
	for {
		hb, ok := <-Heartbeat_Received
		if !ok {
			// le canal est fermé, on arrête la goroutine
			return
		}

		// petite sieste proportionnelle à l’ID du node
		time.Sleep(time.Duration(id) * time.Second)

    // Réponse
		ACK_Sent <- hb
		fmt.Printf("node %d → ACK heartbeat %d\\n", id, hb)
	}
}
`}
        </CodeBlock>
      </div>
    </div>
  );
};

export default Lab4Page;
