// app/lab4/page.tsx
"use client";

import { TextBlock } from "@/components/TextBlock";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

const Lab5Page = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-gray-100 to-gray-50 p-6 pt-40">
      <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">
        Lab 5 — Probabilistic consensus
      </h1>

      <div className="max-w-5xl mx-auto space-y-12">
        <h2 className="text-2xl font-semibold text-gray-800">
          1 — Majority dynamics model
        </h2>

        <h3 className="text-xl font-semibold text-gray-700">
          Question 1 — Probability description
        </h3>

        <TextBlock>
          On remarque que quand <InlineMath math="X_k = m" />, seul le nœud
          sélectionné peut changer l&apos;effectif de 1. Ainsi:
          <BlockMath math="X_{k+1} \in \{m-1, m, m+1\}" />
          On sait aussi que pour chaque noeud, la probabilité qu&apos;il ait
          l&apos;opinion 1 vaut <InlineMath math="\frac{m}{n}" /> que l&apos;on
          notera <InlineMath math="q" />. Ainsi le noeud sélectionné a
          l&apos;opinion de la majorité des 3 noeuds sélectionnés. La
          probabilité que les 3 noeuds aient l&apos;opinion 1 est{" "}
          <InlineMath math="q^3" />. La probabilité que 2 noeuds aient
          l&apos;opinion 1 et 1 noeud l&apos;opinion 0 est{" "}
          <InlineMath math="3q^2(1-q)" />. Donc la probablité que le noeud
          sélectionné prenne l&apos;opinion 1 est d&apos;après les probablités
          totales:
          <BlockMath math="3q^2(1-q) + q^3 = 3q^2 - 2q^3" />
          Mais le noeud sélectionné a une probabilité <InlineMath math="q" />{" "}
          d&apos;avoir déjà l&apos;opinion 1 et donc de ne pas changer
          l&apos;effectif. Ainsi la probabilité que l&apos;effectif augmente de
          1 est:
          <BlockMath math="P(X_{k+1} = m+1 | X_k = m) = (1-q)(3q^2 - 2q^3) = 3q^2 - 5q^3 + 2q^4" />
          Par symétrie, la probabilité que l&apos;effectif diminue de 1 est la
          même:
          <BlockMath math="P(X_{k+1} = m-1 | X_k = m) = q(3(1-q)^2 - 2(1-q)^3) = 3q - 8q^2 + 6q^3 - 2q^4" />
          Enfin, la probabilité que l&apos;effectif reste le même est:
          <BlockMath
            math={String.raw`
    \begin{aligned}
      P(X_{k+1} = m \mid X_k = m)
        &= 1 - P(X_{k+1} = m+1 \mid X_k = m)
           - P(X_{k+1} = m-1 \mid X_k = m) \\
        &= 1 - 3q + 5q^2 - q^3
    \end{aligned}
  `}
          />
          Finalement,
          <BlockMath
            math={String.raw`
    P(X_{k+1} = m' \mid X_k = m)
    =
    \begin{cases}
      3q^2 - 5q^3 + 2q^4, & \text{si } m' = m+1, \\
      1 - 3q + 5q^2 - q^3, & \text{si } m' = m, \\
      3q - 8q^2 + 6q^3 - 2q^4, & \text{si } m' = m-1, \\
      0 & \text{sinon.}
    \end{cases}
  `}
          />
          En remplaçant <InlineMath math="q" /> par{" "}
          <InlineMath math="\frac{m}{n}" />, on obtient le résultat:
          <BlockMath
            math={String.raw`
    P(X_{k+1} = m' \mid X_k = m)
    =
    \begin{cases}
      3\left(\frac{m}{n}\right)^2 - 5\left(\frac{m}{n}\right)^3 + 2\left(\frac{m}{n}\right)^4, & \text{si } m' = m+1, \\
      1 - 3\left(\frac{m}{n}\right) + 5\left(\frac{m}{n}\right)^2 - \left(\frac{m}{n}\right)^3, & \text{si } m' = m, \\
      3\left(\frac{m}{n}\right) - 8\left(\frac{m}{n}\right)^2 + 6\left(\frac{m}{n}\right)^3 - 2\left(\frac{m}{n}\right)^4, & \text{si } m' = m-1, \\
      0 & \text{sinon.}
    \end{cases}
  `}
          />
        </TextBlock>

        <h3 className="text-xl font-semibold text-gray-700">
          Question 2 — Absorbin states
        </h3>

        <TextBlock>
          Les états absorbants sont les états où l&apos;effectif de nœuds ayant
          l&apos;opinion 1 est soit 0 soit n. En effet, si{" "}
          <InlineMath
            math="X_k =
          0"
          />
          , tous les nœuds ont l&apos;opinion 0 et donc l&apos;effectif ne peut
          plus changer. De même, si <InlineMath math="X_k = n" />, tous les
          nœuds ont l&apos;opinion 1 et l&apos;effectif ne peut plus changer non
          plus. Si l&apos;effectif est entre 1 et n-1, il y a toujours une
          probabilité non nulle pour que l&apos;effectif augmente ou diminue,
          car un noeud sélectionné peut choisir trois fois le même noeud.
        </TextBlock>

        <h3 className="text-xl font-semibold text-gray-700">
          Question 3 — Convergence
        </h3>

        <TextBlock>
          Le résultat de ce lemme donne une forte indication sur la convergence
          du consensus de cet algorithme. On part de{" "}
          <InlineMath math="x \in \llbracket 1, n-1 \rrbracket" />,
          c&apos;est-à-dire un mélange d&apos;opinions. Le temps moyen avant
          d&apos;arriver à un consensus (un état absorbant) et de l&apos;ordre
          de <InlineMath math="O(n\log(n))" />. Plus exactement, il est majoré
          par <InlineMath math="\frac{256}{15}n(1+\log(n))" />. Cela signifie
          qu&apos;un tel algorithme est implémentable même pour un grand nombre
          de nœuds, car le temps pour arriver à un consensus restera
          raisonnable.
        </TextBlock>

        <h3 className="text-xl font-semibold text-gray-700">
          Question 4 — Byzantine nodes
        </h3>

        <TextBlock>
          L&apos;omniscience de l&apos;adversaire est plausible dans certains
          contextes. C&apos;est par exemple le cas de la blockchain publique.
          Cela reste une hypothèse forte et assez pessimiste dans le cadre de
          réseaux plus petits ou privés où l&apos;adversaire n&apos;a pas
          forcément accès à toute l&apos;information du réseau. Néanmoins, cette
          hypothèse permet de garantir la sécurité de l&apos;algorithme dans le
          pire des cas.
        </TextBlock>

        <TextBlock>
          L&apos;adversaire peut tenter de retarder la convergence du consensus
          en choisissant les opinions des nœuds byzantins de manière
          stratégique. Par exemple, il choisi pour chaque k de mettre ses noeuds
          sur le choix de la minorité parmi les nœuds honnêtes à l&apos;instant
          k-1. Il peut aussi mettre un biais sur une opinion particulière pour
          influencer le consensus final.
        </TextBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          2 — Implementations of the fast probabilistic consensus
        </h2>
      </div>
    </div>
  );
};

export default Lab5Page;
