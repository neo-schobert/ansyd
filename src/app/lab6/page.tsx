// app/lab4/page.tsx
"use client";

import { CodeBlock } from "@/components/CodeBlock";
import { TextBlock } from "@/components/TextBlock";
import { useState } from "react";
import { BlockMath, InlineMath } from "react-katex";

const Lab6Page = () => {
  const [log1, setLog1] = useState("");
  const [log2, setLog2] = useState("");
  const [running1, setRunning1] = useState(false);
  const [running2, setRunning2] = useState(false);

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
          minimas de la fonction <InlineMath math="F" />
          <BlockMath
            math={String.raw`
              \begin{aligned}
              \frac{\partial F}{\partial a} &= -\frac{2}{K} \sum_{k=1}^{K} x_i^k(y_i^k -ax_i^k -b) \\
              \end{aligned}
            `}
          />
          <BlockMath
            math={String.raw`
              \begin{aligned}
              \frac{\partial F}{\partial b} &= -\frac{2}{K} \sum_{k=1}^{K} (y_i^k -ax_i^k -b) \\
              \end{aligned}
            `}
          />
        </TextBlock>

        <CodeBlock
          log={log2}
          setLog={setLog2}
          running={running2}
          setRunning={setRunning2}
        >
          {`# Inputs: data (x[1..K], y[1..K]), learning rate eta, max_iters, tol
a := 0.0
b := 0.0
for iter in 1..max_iters:
    grad_a := 0.0
    grad_b := 0.0
    for k in 1..K:
        error := y[k] - (a*x[k] + b)
        grad_a += -2.0 * x[k] * error    # = -2 x_k (y_k - a x_k - b)
        grad_b += -2.0 * error           # = -2 (y_k - a x_k - b)
    end for
    grad_a = grad_a / K
    grad_b = grad_b / K

    # update (batch gradient descent)
    a_new := a - eta * grad_a
    b_new := b - eta * grad_b

    # stopping criterion
    if |a_new - a| < tol and |b_new - b| < tol:
        a := a_new; b := b_new
        break
    end if

    a := a_new
    b := b_new
end for

return a, b
`}
        </CodeBlock>
      </div>
    </div>
  );
};

export default Lab6Page;
