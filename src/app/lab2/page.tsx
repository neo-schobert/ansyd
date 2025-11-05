// app/lab2/page.tsx
"use client";
import { CodeBlock } from "@/components/CodeBlock";
import { SchemaBlock } from "@/components/SchemaBlock";
import { TextBlock } from "@/components/TextBlock";

const Lab2Page = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-gray-100 to-gray-50 p-6 pt-40">
      <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
        Lab 2 — Message Passing et Leader Election
      </h1>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* ---------------- Introduction ---------------- */}
        <TextBlock>
          Ce lab explore la communication entre goroutines en Go à travers le
          *message passing*, le random walk et l&apos;élection d&apos;un leader
          dans différents types de topologies. Nous allons examiner des échanges
          synchronisés de messages, des vecteurs complexes, des marches
          aléatoires et des algorithmes d&apos;élection sur anneaux et graphes
          généraux.
        </TextBlock>

        {/* ---------------- 1 Message Passing System ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          1 — Message Passing System
        </h2>
        <TextBlock>
          Dans cette première partie, nous allons programmer en Go un système de
          *message passing* synchrone et une marche aléatoire (*random walk*).
          Nous allons explorer comment les goroutines échangent des messages et
          comment des structures plus complexes peuvent circuler dans un réseau.
        </TextBlock>

        {/* ---------------- Q1 ---------------- */}
        <h3 className="text-xl font-semibold text-gray-700">
          Question 1 — Ping-Pong de messages
        </h3>
        <TextBlock>
          Deux goroutines échangent une balle via un canal. Chaque goroutine
          incrémente le compteur de la balle avant de la renvoyer.
          <ul className="list-disc ml-6">
            <li>
              Si <code>time.Sleep</code> est modifié, le nombre d&apos;échanges
              change.
            </li>
            <li>
              Ce code n&apos;est pas event-driven : les goroutines bloquent sur
              le canal.
            </li>
            <li>
              On peut simplifier en fusionnant les fonctions de joueurs en une
              seule fonction paramétrée.
            </li>
          </ul>
        </TextBlock>

        <CodeBlock endpoint="https://go-backend-531057961347.europe-west1.run.app/lab2?fn=q1">
          {`package main

import (
  "fmt"
  "time"
)

// Structure représentant la balle
type Ball struct{ hits int }

// Fonction générique pour un joueur
func player(name string, table chan *Ball, delay time.Duration) {
  for {
    ball := <-table          // reçoit la balle
    ball.hits++              // incrémente le compteur
    fmt.Println(name, "hits:", ball.hits)
    time.Sleep(delay)        // temporisation pour simuler le temps de traitement
    table <- ball            // renvoie la balle
  }
}

func main() {
  table := make(chan *Ball)
  go player("Alice", table, 100*time.Millisecond)
  go player("Bob", table, 100*time.Millisecond)

  table <- &Ball{}           // lancer le jeu
  time.Sleep(1 * time.Second) // laisser les goroutines s'exécuter
  <-table                     // récupérer la balle à la fin
}`}
        </CodeBlock>

        {/* ---------------- Q2 ---------------- */}
        <h3 className="text-xl font-semibold text-gray-700">
          Question 2 — Passage de vecteurs
        </h3>
        <TextBlock>
          Ici, chaque nœud reçoit un vecteur. Chaque composante k est
          incrémentée de k à chaque passage, illustrant la circulation de
          structures plus complexes.
        </TextBlock>

        <CodeBlock endpoint="https://go-backend-531057961347.europe-west1.run.app/lab2?fn=q2">
          {`package main

import (
  "fmt"
  "time"
)

// Structure représentant le vecteur
type VectorBall struct{ hitsVector []int }

// Fonction générique pour un joueur qui traite des vecteurs
func player(name string, table chan *VectorBall, rounds int) {
  for range rounds {
    ball := <-table                   // réception du vecteur
    for i := range ball.hitsVector {
      ball.hitsVector[i] += i        // ajout de k à la k-ième composante
    }
    fmt.Println(name, "vector:", ball.hitsVector)
    time.Sleep(100 * time.Millisecond)
    table <- ball                     // renvoi du vecteur
  }
}

func main() {
  table := make(chan *VectorBall)
  rounds := 5
  go player("Alice", table, rounds)
  go player("Bob", table, rounds)

  table <- &VectorBall{hitsVector: []int{0, 0, 0}}
  time.Sleep(1 * time.Second)
  <-table
}`}
        </CodeBlock>

        {/* ---------------- Q3 ---------------- */}
        {/* ---------------- Q3 ---------------- */}
        <h3 className="text-xl font-semibold text-gray-700">
          Question 3 — Random Walk
        </h3>
        <TextBlock>
          Un token se déplace aléatoirement dans un graphe représenté par une
          matrice d&apos;adjacence. La probabilité qu&apos;un voisin reçoive le
          token est <code>1/N_u</code>, où <code>N_u</code> est le nombre de
          voisins du nœud actuel.
        </TextBlock>

        <h3 className="text-xl font-semibold text-gray-700">
          Question 4 — Implémentation du random walk
        </h3>

        <SchemaBlock
          title="Exemple de Graphe pris ici"
          imageSrc="/lab2/random walk.png"
          alt="Graph d'exemple pris ici"
        />

        <CodeBlock endpoint="https://go-backend-531057961347.europe-west1.run.app/lab2?fn=q3">
          {`package main

import (
  "fmt"
  "math/rand"
  "time"
)

// Node pour Random Walk
type Node struct {
  edge  int
  token string
}

// Matrice du graphe
type RandomWalkMatrix struct {
  nodes [][]Node
}

// Fonction de random walk
func randomWalk(startNode int, matrix *RandomWalkMatrix, steps int) int {
  current := startNode
  for i := range steps {
    fmt.Println("Step", i+1, "token at node", current)
    neighbors := []int{}
    for j, node := range matrix.nodes[current] {
      if node.edge == 1 && j != current {
        neighbors = append(neighbors, j)
      }
    }
    if len(neighbors) == 0 {
      fmt.Println("Node", current, "has no neighbors, stopping walk")
      break
    }
    next := neighbors[rand.Intn(len(neighbors))]
    fmt.Println("Token moves from", current, "to", next)
    current = next
    time.Sleep(100 * time.Millisecond)
  }
  fmt.Println("Random walk finished, token at node", current)
  return current
}

func main() {
  matrix := &RandomWalkMatrix{
    nodes: [][]Node{
      {{1, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {0, ""}, {1, ""}, {0, ""}},
      {{1, ""}, {1, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {0, ""}, {1, ""}},
      {{0, ""}, {1, ""}, {1, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {0, ""}},
      {{1, ""}, {0, ""}, {1, ""}, {1, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}},
      {{0, ""}, {1, ""}, {0, ""}, {1, ""}, {1, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}},
      {{1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {1, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}},
      {{0, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {1, ""}, {1, ""}, {0, ""}, {1, ""}},
      {{0, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {1, ""}, {1, ""}, {0, ""}},
      {{1, ""}, {0, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {1, ""}, {1, ""}},
      {{0, ""}, {1, ""}, {0, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {0, ""}, {1, ""}, {1, ""}},
    },
  }

  go randomWalk(0, matrix, 15)
}`}
        </CodeBlock>

        {/* ---------------- 2 Leader Election on a Ring ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          2 — Leader Election on a Ring
        </h2>
        <TextBlock>
          Chaque nœud propage l&apos;identifiant maximum qu&apos;il connaît.
          Quand un nœud reçoit son propre identifiant, il devient leader. La
          structure <code>Message</code>
          contient : <code>max</code>, <code>counter</code>,{" "}
          <code>terminate</code>.
        </TextBlock>

        <CodeBlock endpoint="https://go-backend-531057961347.europe-west1.run.app/lab2?fn=q4">
          {`package main

import "fmt"

// Structure de message pour l'élection
type Message struct {
  max, counter int
  terminate    string
}

// Fonction représentant un nœud du ring
func nodeRing(id int, in, out chan *Message, decision chan *Message) {
  state := &Message{max:id, counter:1, terminate:"No"}

  for msg := range in {
    newCounter := msg.counter + 1

    if msg.max > state.max {
      state.max = msg.max
      state.counter = newCounter
      out <- state
    } else if msg.max < state.max {
      state.counter = newCounter
      out <- state
    } else {
      // Si le max revient au nœud initial → leader
      state.counter = newCounter + 1
      state.terminate = "Yes"
      decision <- state
      return
    }
  }
}

func main() {
  ch1to2 := make(chan *Message)
  ch2to3 := make(chan *Message)
  ch3to1 := make(chan *Message)
  decision := make(chan *Message)

  go nodeRing(1, ch3to1, ch1to2, decision)
  go nodeRing(2, ch1to2, ch2to3, decision)
  go nodeRing(3, ch2to3, ch3to1, decision)

  ch1to2 <- &Message{max:1, counter:1, terminate:"No"} // démarrage de l'élection
  res := <-decision
  fmt.Println("Leader elected in ring: max:", res.max, " counter:", res.counter, " terminate:", res.terminate)
}`}
        </CodeBlock>

        {/* ---------------- 3 Bonus: Leader election in General Graphs ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          3 — Leader Election in General Graphs
        </h2>
        <TextBlock>
          Chaque nœud propage le maximum qu&apos;il connaît à tous ses voisins.
          Après un nombre de tours égal au diamètre du graphe, le nœud avec
          l&apos;ID le plus élevé est élu leader.
        </TextBlock>

        <SchemaBlock
          title="Exemple de Graphe pris ici"
          imageSrc="/lab2/leader election in general graph.png"
          alt="Graph d'exemple pris ici"
        />

        <CodeBlock endpoint="https://go-backend-531057961347.europe-west1.run.app/lab2?fn=q5">
          {`package main

import "fmt"

// Structure de message
type Message struct {
  max, counter int
  terminate    string
}

type matriceAdj struct {
  nodes [][]int
}

// Diffusion sur tous les canaux sortants
func broadcast(outChans []chan *Message, m *Message) {
  for _, out := range outChans {
    out <- &Message{max: m.max, counter: m.counter, terminate: m.terminate}
  }
}

// Fonction représentant un nœud du graphe général
func generalNode(id int, inChans []chan *Message, outChans []chan *Message, decision chan *Message, diameter int) {
  state := &Message{max: id, counter: 1, terminate: "No"}
  fan := make(chan *Message, 100)

  for _, ch := range inChans {
    c := ch
    go func() {
      for msg := range c {
        fan <- msg
      }
    }()
  }

  for {
    msg := <-fan
    newCounter := msg.counter + 1
    if msg.max > state.max {
      state.max = msg.max
      state.counter = newCounter
      broadcast(outChans, &Message{max: state.max, counter: state.counter, terminate: "No"})
    } else if msg.max < state.max {
      state.counter = newCounter
      broadcast(outChans, &Message{max: state.max, counter: state.counter, terminate: "No"})
    } else {
      if newCounter < diameter {
        state.counter = newCounter
        broadcast(outChans, &Message{max: state.max, counter: state.counter, terminate: "No"})
      }
      state.counter = newCounter + 1
      state.terminate = "Yes"
      decision <- &Message{max: state.max, counter: state.counter, terminate: state.terminate}
      return
    }
  }
}

func main() {
  graph := &matriceAdj{
    nodes: [][]int{
      {0, 1, 0, 1, 0},
      {1, 0, 1, 0, 1},
      {0, 1, 0, 1, 0},
      {1, 0, 1, 0, 1},
      {0, 1, 0, 1, 0},
    },
  }

  n := len(graph.nodes)
  channelsFrom := make([][]chan *Message, n)
  for i := range n {
    channelsFrom[i] = make([]chan *Message, n)
    for j := range n {
      if graph.nodes[i][j] == 1 {
        channelsFrom[i][j] = make(chan *Message, 10)
      }
    }
  }

  decisionGraph := make(chan *Message)

  for i := range n {
    inbox := []chan *Message{}
    outbox := []chan *Message{}
    for j := range n {
      if graph.nodes[i][j] == 1 {
        outbox = append(outbox, channelsFrom[i][j])
        inbox = append(inbox, channelsFrom[j][i])
      }
    }
    go generalNode(i, inbox, outbox, decisionGraph, 10)
  }

  start := &Message{max: 1, counter: 1, terminate: "No"}
  for j := range n {
    if channelsFrom[0][j] != nil {
      channelsFrom[0][j] <- start
    }
  }

  resGraph := <-decisionGraph
  fmt.Println("Leader elected in general graph: max=", resGraph.max, " terminate=", resGraph.terminate, "\n")
}`}
        </CodeBlock>

        {/* ---------------- 4 — Résultats Leader Election k-Neighborhood ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          4 — Leader Election k-Neighborhood
        </h2>

        <TextBlock>
          <ul className="list-disc ml-6">
            <li>
              <strong>
                4.1 — Maximum de winners en phase <code>k</code> :
              </strong>
              Chaque winner occupe au moins <code>2*f(k)+1</code> sommets (son
              voisinage). Donc le nombre maximal de winners est borné par{" "}
              <code>⌊ n / (2*f(k)+1) ⌋</code>.
            </li>
            <li>
              <strong>4.2 — Nombre de phases nécessaires :</strong>
              Le leader apparaît lorsque f(<code>k</code>) couvre au moins la
              moitié de l&apos;anneau : le plus petit <code>k</code> tel que{" "}
              <code>f(k) ≥ ⌊ n/2 ⌋</code>. C&apos;est donc{" "}
              <code>K = log2(n/2)</code> pour f(k) = 2^k.
            </li>
            <li>
              <strong>4.3 — Nombre total de messages :</strong>À la phase{" "}
              <code>k</code>, chaque winner envoie 2 probes (2 directions),
              chaque probe parcourt 2^<code>k</code> arcs et revient → 4*2^
              <code>k</code> messages par winner. Nombre de winners ≤ n / 2^
              {<code>k + 1</code>} → messages par phase ≤ (n / 2^
              {<code>k + 1</code>}) * 4*2^<code>k</code> = 2n. Nombre total de
              phases K+1 → total messages ≤ 2n * (K+1) = 2n * (log2(n/2)+1) =
              O(n log n)
            </li>
          </ul>
        </TextBlock>
      </div>
    </div>
  );
};

export default Lab2Page;
