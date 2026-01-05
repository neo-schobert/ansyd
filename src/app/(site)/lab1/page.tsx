// app/lab1/page.tsx
"use client";
import { CodeBlock } from "@/components/CodeBlock";
import { TextBlock } from "@/components/TextBlock";
import { useState } from "react";

const Lab1Page = () => {
  const [log1, setLog1] = useState("");
  const [log2, setLog2] = useState("");
  const [log3, setLog3] = useState("");
  const [log4, setLog4] = useState("");
  const [running1, setRunning1] = useState(false);
  const [running2, setRunning2] = useState(false);
  const [running3, setRunning3] = useState(false);
  const [running4, setRunning4] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-gray-100 to-gray-50 p-6 pt-40">
      {/* Titre principal */}
      <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
        Lab 1 — Introduction à Go
      </h1>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Introduction */}
        <TextBlock>
          Ce premier lab plonge dans l’univers du langage Go, en explorant les
          structures, les pointeurs et la concurrence avec les goroutines.
          Chaque section correspond à une question pratique, et vous pouvez
          exécuter le code directement via le backend sur Cloud Run pour voir
          les résultats en temps réel. L’objectif est de comprendre comment Go
          gère les données et les threads de manière simple mais puissante.
        </TextBlock>

        {/* ---------------- Q1 ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 1 — Structures
        </h2>
        <TextBlock>
          Une structure en Go permet de regrouper plusieurs champs sous un seul
          type. Ici, nous créons une structure <code>node</code> représentant un
          nœud, avec un nom et un vecteur de valeurs flottantes. Cela nous
          permet de modéliser des données complexes de manière claire et typée.
          Dans cet exemple, nous définissons un nœud nommé{" "}
          <strong>Alice</strong> associé au vecteur <code>[1.1, 2.2]</code>.
        </TextBlock>

        <CodeBlock
          endpoint="https://go-backend-531057961347.europe-west1.run.app/lab1?fn=q1"
          log={log1}
          setLog={setLog1}
          running={running1}
          setRunning={setRunning1}
        >
          {`package main

import "fmt"

// Définition d'une structure 'node' avec un nom et un vecteur de valeurs
type node struct {
  name   string    // Nom du nœud
  vector []float64 // Vecteur de valeurs associées
}

func main() {
  // Création d'une instance de node
  node1 := node{name: "Alice", vector: []float64{1.1, 2.2}}
  
  // Affichage du nom du nœud
  fmt.Println("Node name:", node1.name)
  
  // Parcours et affichage des valeurs du vecteur
  for _, v := range node1.vector {
    fmt.Printf("\t%v\n", v)
  }
}`}
        </CodeBlock>

        {/* ---------------- Q2 ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 2 — Goroutines et Channels
        </h2>
        <TextBlock>
          Go rend la concurrence simple grâce aux goroutines et aux channels.
          Chaque goroutine est une fonction exécutée en parallèle. Les channels
          permettent de communiquer entre elles de manière sûre et ordonnée.
        </TextBlock>

        <TextBlock>
          <strong>Question pédagogique :</strong> Quel type de file sont les
          channels en Go ? <br />
          Réponse : les channels sont FIFO (First In, First Out). Le premier
          élément envoyé dans le channel sera le premier lu. Cela garantit que
          les résultats arrivent dans le même ordre qu’ils ont été envoyés.
        </TextBlock>

        <TextBlock>
          Dans cet exemple, nous divisons un tableau en deux parties et
          utilisons deux goroutines pour calculer la somme de chaque moitié. Les
          résultats sont ensuite combinés via un canal, illustrant la
          communication sûre entre threads sans partage mémoire explicite.
        </TextBlock>

        <CodeBlock
          endpoint="https://go-backend-531057961347.europe-west1.run.app/lab1?fn=q2"
          log={log2}
          setLog={setLog2}
          running={running2}
          setRunning={setRunning2}
        >
          {`package main

import "fmt"

// Fonction pour calculer la somme d'un slice et envoyer le résultat dans un channel
func sum(s []int, c chan int) {
  total := 0
  for _, v := range s { 
    total += v 
  }
  c <- total // envoi du résultat vers le channel
}

func main() {
  s := []int{7, 2, 8, -9, 4, 0} // Tableau à traiter
  c := make(chan int) // Création d'un channel pour communiquer entre goroutines

  // Lancement de deux goroutines pour calculer la somme de chaque moitié
  go sum(s[:len(s)/2], c)
  go sum(s[len(s)/2:], c)

  // Récupération des résultats depuis le channel
  y := <-c
  x := <-c

  // Affichage des résultats et d'une opération sur ces valeurs
  fmt.Println(x, y, x/y)
}`}
        </CodeBlock>

        {/* ---------------- Q3 ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 3 — Réseau de goroutines
        </h2>

        <TextBlock>
          Ici, nous améliorons le modèle précédent en utilisant deux channels
          indépendants. Chaque goroutine renvoie son résultat dans un channel
          dédié, ce qui évite tout mélange de données et assure une
          synchronisation claire et prévisible.
        </TextBlock>

        <TextBlock>
          <strong>Question pédagogique :</strong> On veut créer un réseau de
          goroutines pour calculer plusieurs sous-sommes. Pourquoi utiliser
          plusieurs channels ? <br />
          Réponse : Chaque channel dédié permet d’éviter que les résultats se
          mélangent et rend la synchronisation plus simple et prévisible. Cela
          devient indispensable lorsque le nombre de goroutines augmente.
        </TextBlock>

        <CodeBlock
          endpoint="https://go-backend-531057961347.europe-west1.run.app/lab1?fn=q3"
          log={log3}
          setLog={setLog3}
          running={running3}
          setRunning={setRunning3}
        >
          {`package main

import "fmt"

func sum(s []int, c chan int) {
  total := 0
  for _, v := range s { 
    total += v 
  }
  c <- total
}

func main() {
  s := []int{7, 2, 8, -9, 4, 0}
  c1 := make(chan int)
  c2 := make(chan int)

  // Chaque goroutine utilise son propre channel
  go sum(s[:len(s)/2], c1)
  go sum(s[len(s)/2:], c2)

  x := <-c1
  y := <-c2

  // Affichage des résultats et de leur somme
  fmt.Println(x, y, x+y)
}`}
        </CodeBlock>

        {/* ---------------- Q4 ---------------- */}
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 4 — Communication entre structures
        </h2>

        <TextBlock>
          Initialement, la structure <code>Data</code> contient un entier et
          increment() ajoute 10 via un channel. Ici, nous étendons ce modèle
          pour travailler sur un tableau de taille indéfinie.
        </TextBlock>

        <TextBlock>
          <strong>Question pédagogique :</strong> Comment faire pour additionner
          deux slices entre goroutines ? <br />
          Réponse : La fonction <code>
            increment(v []int, c chan *Data)
          </code>{" "}
          reçoit la structure et le slice <code>v</code>, puis ajoute élément
          par élément les valeurs de <code>v</code> à la structure. Le résultat
          est renvoyé via le même channel.
        </TextBlock>

        <CodeBlock
          endpoint="https://go-backend-531057961347.europe-west1.run.app/lab1?fn=q4"
          log={log4}
          setLog={setLog4}
          running={running4}
          setRunning={setRunning4}
        >
          {`package main

import "fmt"

// Structure contenant un tableau d'entiers
type Data struct {
  x []int
}

// Fonction qui incrémente chaque élément de Data selon le vecteur v
func increment(v []int, c chan *Data) {
  for {
    t := <-c // réception de la structure depuis le channel
    for i := range t.x {
      t.x[i] += v[i] // incrémentation de chaque élément
    }
    c <- t // renvoi de la structure modifiée
  }
}

func main() {
  c := make(chan *Data)
  t := Data{x: []int{10, 20, 30}} // données initiales
  v := []int{1, 2, 3} // vecteur à ajouter

  go increment(v, c) // lancement de la goroutine

  fmt.Println("Before:", t.x) // affichage avant modification
  c <- &t                  // envoi vers la goroutine
  x := <-c                  // récupération des données modifiées
  fmt.Println("After:", x.x) // affichage après modification
}`}
        </CodeBlock>

        <TextBlock>
          Ce lab met en lumière la puissance de Go pour gérer des données
          complexes et la concurrence. Grâce aux goroutines et aux channels, il
          est possible de synchroniser et de partager des informations entre
          threads de façon sûre, sans recourir à des mécanismes lourds comme les
          mutex. La combinaison de structures typées et de la concurrence rend
          Go particulièrement adapté aux applications performantes et scalables.
        </TextBlock>
      </div>
    </div>
  );
};

export default Lab1Page;
