// app/lab4/page.tsx
"use client";

import { CodeBlock } from "@/components/CodeBlock";
import { TextBlock } from "@/components/TextBlock";
import { useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

const Lab6Page = () => {
  const [log1, setLog1] = useState("");
  const [log2, setLog2] = useState("");
  const [log3, setLog3] = useState("");
  const [log4, setLog4] = useState("");
  const [log5, setLog5] = useState("");
  const [running1, setRunning1] = useState(false);
  const [running2, setRunning2] = useState(false);
  const [running3, setRunning3] = useState(false);
  const [running4, setRunning4] = useState(false);
  const [running5, setRunning5] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-gray-100 to-gray-50 p-6 pt-40">
      <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
        Lab 6 — Distributed Machine Learning
      </h1>

      <div className="max-w-5xl mx-auto space-y-12">
        <h2 className="text-2xl font-semibold text-gray-800">
          Question 1 — Generate Observations
        </h2>

        <CodeBlock
          log={log1}
          setLog={setLog1}
          running={running1}
          setRunning={setRunning1}
        >
          {`var True_regressor float64 = 2
var True_intercept float64 = 5
var number_data int = 1000
x_values_node_1 := make([]float64, number_data)
y_values_node_1 := make([]float64, number_data)
x_values_node_2 := make([]float64, number_data)
y_values_node_2 := make([]float64, number_data)
x_values_node_3 := make([]float64, number_data)
y_values_node_3 := make([]float64, number_data)
s1 := rand.NewSource(time.Now().UnixNano())
r1 := rand.New(s1)
for i := 0; i < number_data; i++ {
  var rnd = r1.NormFloat64()
  x_values_node_1[i] = r1.Float64()
  y_values_node_1[i] = True_regressor*x_values_node_1[i] + True_intercept + r1.NormFloat64()
  x_values_node_2[i] = r1.Float64()
  y_values_node_2[i] = True_regressor*x_values_node_2[i] + True_intercept + r1.NormFloat64()
  x_values_node_3[i] = r1.Float64()
  y_values_node_3[i] = True_regressor*x_values_node_3[i] + True_intercept + r1.NormFloat64()
}`}
        </CodeBlock>

        <TextBlock>
          <code>s1 := rand.NewSource(time.Now().UnixNano())</code> sert à
          initialiser la seed du générateur de nombres aléatoires avec une
          valeur basée sur le temps actuel en nanosecondes. Cela garantit que
          chaque exécution du programme produit une séquence différente de
          nombres aléatoires. Ensuite, <code>r1 := rand.New(s1)</code> crée une
          nouvelle instance du générateur de nombres aléatoires en utilisant
          cette seed. Ainsi, toutes les valeurs générées par <code>r1</code>{" "}
          seront pseudo-aléatoires et dépendront de la seed initiale.
        </TextBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 2 — Gradient Descent
        </h2>

        <TextBlock>
          Ce problème d&apos;optimisation se résout en regardant où sont les
          minimas de la fonction <InlineMath math="F" />.
          <BlockMath
            math={String.raw` \begin{aligned} \frac{\partial F}{\partial a} &= -\frac{2}{K} \sum_{k=1}^{K} x_i^k \bigl(y_i^k - a x_i^k - b\bigr), \\[6pt] \frac{\partial F}{\partial b} &= -\frac{2}{K} \sum_{k=1}^{K} \bigl(y_i^k - a x_i^k - b\bigr). \end{aligned} `}
          />
        </TextBlock>

        <TextBlock>
          Pour implémenter cela, l&apos;idée serait d&apos;itérer sur un certain
          nombre d&apos;itérations, en calculant à chaque fois les gradients par
          rapport à <InlineMath math="a" /> et <InlineMath math="b" />. Ensuite,
          on met à jour <InlineMath math="a" /> et <InlineMath math="b" /> en
          soustrayant une fraction (le taux d&apos;apprentissage) des gradients
          calculés. On continue ce processus jusqu&apos;à ce que les changements
          dans <InlineMath math="a" /> et <InlineMath math="b" /> soient
          inférieurs à une certaine tolérance, ou jusqu&apos;à atteindre un
          nombre maximum d&apos;itérations.
        </TextBlock>

        <CodeBlock
          log={log2}
          setLog={setLog2}
          running={running2}
          setRunning={setRunning2}
        >
          {`Inputs: x[1..K], y[1..K], learning rate η, max iterations N, tolerance ε

Initialize: 
    a ← 0
    b ← 0

Repeat for iter = 1 to N:
    grad_a ← 0
    grad_b ← 0

    For k = 1 to K:
        error ← y[k] − (a * x[k] + b)
        grad_a ← grad_a − 2 * x[k] * error
        grad_b ← grad_b − 2 * error
    End For

    grad_a ← grad_a / K
    grad_b ← grad_b / K

    a_new ← a − η * grad_a
    b_new ← b − η * grad_b

    If |a_new − a| < ε AND |b_new − b| < ε then
        a ← a_new
        b ← b_new
        Stop
    End If

    a ← a_new
    b ← b_new

End Repeat

Return a, b
`}
        </CodeBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 3 — Gradient Descent Implementation
        </h2>

        <CodeBlock
          log={log3}
          setLog={setLog3}
          running={running3}
          setRunning={setRunning3}
        >
          {`func step(b_current float64, a_current float64, x_values []float64, y_values []float64, learning_rate float64) (float64, float64) {
    var b_gradient float64 = 0
    var a_gradient float64 = 0
    length := len(y_values)
    
    for i := 0; i < length; i++ {
        two_over_n := float64(2) / float64(length)
        b_gradient += -two_over_n * (y_values[i] - (a_current*x_values[i] + b_current))
        a_gradient += -two_over_n * x_values[i] * (y_values[i] - (a_current*x_values[i] + b_current))
    }

    new_b := b_current - learning_rate*b_gradient
    new_a := a_current - learning_rate*a_gradient
    return new_b, new_a
}`}
        </CodeBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 4 — Regression Implementation
        </h2>

        <CodeBlock
          endpoint={`https://go-backend-531057961347.europe-west1.run.app/lab6?fn=q4`}
          log={log4}
          setLog={setLog4}
          running={running4}
          setRunning={setRunning4}
        >
          {`package main

import (
    "fmt"
    "math/rand"
    "time"
)

func Regression(x_values []float64, y_values []float64, learning_rate float64, epochs int) (float64, float64) {
    if len(x_values) == 0 || len(y_values) == 0 {
        panic("Input arrays must not be empty.")
    }

    // Initialization
    var b_current float64 = 0
    var a_current float64 = 0

    // Iterations of the gradient step
    for i := 0; i < epochs; i++ {
        b_current, a_current = step(b_current, a_current, x_values, y_values, learning_rate)
    }

    return b_current, a_current
}

func main() {
    // Paramètres des données
    number_data := 100
    true_a := 2.0
    true_b := 5.0

    // Génération des données
    x_values := make([]float64, number_data)
    y_values := make([]float64, number_data)

    s := rand.NewSource(time.Now().UnixNano())
    r := rand.New(s)

    for i := 0; i < number_data; i++ {
        x_values[i] = r.Float64()
        y_values[i] = true_a*x_values[i] + true_b + r.NormFloat64() // bruit normal
    }

    // Paramètres du gradient descent
    learning_rate := 0.1
    epochs := 1000

    // Appel de la régression
    est_b, est_a := Regression(x_values, y_values, learning_rate, epochs)

    fmt.Printf("Estimation : a = %.4f, b = %.4f\\n", est_a, est_b)
    fmt.Printf("Valeurs réelles : a = %.4f, b = %.4f\\n", true_a, true_b)
}`}
        </CodeBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 5 — Distributed Set-up
        </h2>

        <CodeBlock
          endpoint={`https://go-backend-531057961347.europe-west1.run.app/lab6?fn=q5`}
          log={log5}
          setLog={setLog5}
          running={running5}
          setRunning={setRunning5}
        >
          {`package main

import (
    "fmt"
    "math/rand"
    "time"
)

// Structure pour les paramètres de la régression
type Linear_regression_Parameters struct {
    Intercept  float64
    Regressor  float64
}

// Step function: mise à jour locale
func step(b_current float64, a_current float64, x_values []float64, y_values []float64, learning_rate float64) (float64, float64) {
    b_gradient := 0.0
    a_gradient := 0.0
    length := len(y_values)

    for i := 0; i < length; i++ {
        two_over_n := float64(2) / float64(length)
        b_gradient += -two_over_n * (y_values[i] - (a_current*x_values[i] + b_current))
        a_gradient += -two_over_n * x_values[i] * (y_values[i] - (a_current*x_values[i] + b_current))
    }

    new_b := b_current - learning_rate*b_gradient
    new_a := a_current - learning_rate*a_gradient
    return new_b, new_a
}

// Regression distribuée pour un nœud
func Regression(x_values []float64, y_values []float64, learning_rate float64, c chan Linear_regression_Parameters, epochs int) {
    b_current := 0.0
    a_current := 0.0

    for i := 0; i < epochs; i++ {
        // Étape locale
        b_local, a_local := step(b_current, a_current, x_values, y_values, learning_rate)

        // Pull depuis le channel global
        global_params := <-c

        // Mise à jour en moyenne avec les paramètres globaux
        b_current = 0.5*b_local + 0.5*global_params.Intercept
        a_current = 0.5*a_local + 0.5*global_params.Regressor

        // Push des nouveaux paramètres dans le channel
        c <- Linear_regression_Parameters{Intercept: b_current, Regressor: a_current}
    }
}

func main() {
    rand.Seed(time.Now().UnixNano())
    c := make(chan Linear_regression_Parameters, 1)

    // Paramètres des données
    True_regressor := 2.0
    True_intercept := 5.0
    number_data := 1000

    x_values_node_1 := make([]float64, number_data)
    y_values_node_1 := make([]float64, number_data)
    x_values_node_2 := make([]float64, number_data)
    y_values_node_2 := make([]float64, number_data)
    x_values_node_3 := make([]float64, number_data)
    y_values_node_3 := make([]float64, number_data)

    r := rand.New(rand.NewSource(time.Now().UnixNano()))
    for i := 0; i < number_data; i++ {
        x_values_node_1[i] = r.Float64()
        y_values_node_1[i] = True_regressor*x_values_node_1[i] + True_intercept + r.NormFloat64()
        x_values_node_2[i] = r.Float64()
        y_values_node_2[i] = True_regressor*x_values_node_2[i] + True_intercept + r.NormFloat64()
        x_values_node_3[i] = r.Float64()
        y_values_node_3[i] = True_regressor*x_values_node_3[i] + True_intercept + r.NormFloat64()
    }

    // Initialisation du channel avec des paramètres neutres
    c <- Linear_regression_Parameters{Intercept: 0, Regressor: 0}

    epochs := 1000
    learning_rate := 0.1

    // Lancement des 3 nœuds en parallèle
    go Regression(x_values_node_1, y_values_node_1, learning_rate, c, epochs)
    go Regression(x_values_node_2, y_values_node_2, learning_rate, c, epochs)
    go Regression(x_values_node_3, y_values_node_3, learning_rate, c, epochs)

    // Attendre la convergence
    time.Sleep(2 * time.Second)

    // Récupérer les paramètres finaux
    final_params := <-c
    fmt.Printf("Intercept: %f\\n", final_params.Intercept)
    fmt.Printf("Coefficient: %f\\n", final_params.Regressor)
}`}
        </CodeBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          Question 6 — Approximation Stochastique
        </h2>

<TextBlock>
  On considère pour chaque nœud <InlineMath math="i" /> le problème de régression linéaire suivant :
  <BlockMath
    math={String.raw`F_i(a,b) = \frac{1}{K} \sum_{k=1}^{K} (y_i^k - a x_i^k - b)^2`}
  />
</TextBlock>

<TextBlock>
  Les gradients de cette fonction de coût sont donnés par :
  <BlockMath
    math={String.raw`\begin{aligned} 
\frac{\partial F_i}{\partial a} &= -\frac{2}{K} \sum_{k=1}^{K} x_i^k \bigl(y_i^k - a x_i^k - b\bigr), \\[2mm] 
\frac{\partial F_i}{\partial b} &= -\frac{2}{K} \sum_{k=1}^{K} \bigl(y_i^k - a x_i^k - b\bigr). 
\end{aligned}`}
  />
</TextBlock>

<TextBlock>
  Dans l&apos;algorithme distribué, chaque nœud effectue à chaque itération une étape locale :

  <BlockMath
    math={String.raw`(b_{\text{local}}, a_{\text{local}}) = \text{step}(b_{\text{current}}, a_{\text{current}}, \{x_i^k\}, \{y_i^k\}, \eta)`}
  />

  Puis il récupère les paramètres globaux depuis le canal et met à jour ses paramètres en moyenne :

  <BlockMath
    math={String.raw`(b_{\text{current}}, a_{\text{current}}) = \frac{1}{2} (b_{\text{local}}, a_{\text{local}}) + \frac{1}{2} (b_{\text{global}}, a_{\text{global}})`}
  />
</TextBlock>

<TextBlock>
  Si chaque nœud ne regarde qu&apos;un sous-ensemble de ses données à chaque itération, le gradient calculé devient un <b>gradient bruité</b> :

  <BlockMath
    math={String.raw`g_i(\theta^{(t)}, \xi_t) = \nabla F_i(\theta^{(t)}; \xi_t), \quad \theta = (b,a)`}
  />

  La mise à jour globale peut alors s&apos;écrire comme une <b>approximation stochastique</b> :

  <BlockMath
    math={String.raw`\theta^{(t+1)} = \theta^{(t)} - \gamma_t g_i(\theta^{(t)}, \xi_t) + \frac{1}{2}(\theta_{\text{global}} - \theta^{(t)})`}
  />

  <ul>
    <li><InlineMath math="-\gamma_t g_i(\theta^{(t)}, \xi_t)" /> : gradient bruité local</li>
    <li><InlineMath math="\frac{1}{2}(\theta_{\text{global}} - \theta^{(t)})" /> : terme de consensus pour stabiliser et synchroniser les nœuds</li>
  </ul>
</TextBlock>

<TextBlock>
  <ul>
    <li>La approximation stochastique explique pourquoi les paramètres oscillent légèrement autour de la solution globale (le gradient local est bruité par l&apos;échantillonnage des données).</li>
    <li>Le terme de consensus réduit ces oscillations et accélère la convergence.</li>
    <li>Avec suffisamment d&apos;itérations et de nœuds, l&apos;algorithme converge vers une solution proche de la régression linéaire classique sur toutes les données.</li>
  </ul>

  L&apos;algorithme distribué est une approximation stochastique avec un terme de consensus, ce qui explique sa stabilité et la vitesse de convergence observée.
</TextBlock>

      </div>
    </div>
  );
};

export default Lab6Page;
