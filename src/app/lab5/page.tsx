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
          notera <InlineMath math="p" />. Ainsi le noeud sélectionné a
          l&apos;opinion de la majorité des 3 noeuds sélectionnés. La
          probabilité que les 3 noeuds aient l&apos;opinion 1 est{" "}
          <InlineMath math="p^3" />. La probabilité que 2 noeuds aient
          l&apos;opinion 1 et 1 noeud l&apos;opinion 0 est{" "}
          <InlineMath math="3p^2(1-p)" />. Donc la probablité que le noeud
          sélectionné prenne l&apos;opinion 1 est d&apos;après les probablités
          totales:
          <BlockMath math="3p^2(1-p) + p^3 = 3p^2 - 2p^3" />
          Mais le noeud sélectionné a une probabilité <InlineMath math="p" />{" "}
          d&apos;avoir déjà l&apos;opinion 1 et donc de ne pas changer
          l&apos;effectif. Ainsi la probabilité que l&apos;effectif augmente de
          1 est:
          <BlockMath math="P(X_{k+1} = m+1 | X_k = m) = (1-p)(3p^2 - 2p^3) = 3p^2 - 5p^3 + 2p^4" />
          Par symétrie, la probabilité que l&apos;effectif diminue de 1 est la
          même:
          <BlockMath math="P(X_{k+1} = m-1 | X_k = m) = p(3(1-p)^2 - 2(1-p)^3) = 3p - 8p^2 + 6p^3 - 2p^4" />
          Enfin, la probabilité que l&apos;effectif reste le même est:
          <BlockMath
            math={String.raw`
    \begin{aligned}
      P(X_{k+1} = m \mid X_k = m)
        &= 1 - P(X_{k+1} = m+1 \mid X_k = m)
           - P(X_{k+1} = m-1 \mid X_k = m) \\
        &= 1 - 3p + 5p^2 - p^3
    \end{aligned}
  `}
          />
          Finalement,
          <BlockMath
            math={String.raw`
    P(X_{k+1} = m' \mid X_k = m)
    =
    \begin{cases}
      3p^2 - 5p^3 + 2p^4, & \text{si } m' = m+1, \\
      1 - 3p + 5p^2 - p^3, & \text{si } m' = m, \\
      3p - 8p^2 + 6p^3 - 2p^4, & \text{si } m' = m-1, \\
      0 & \text{sinon.}
    \end{cases}
  `}
          />
          En remplaçant <InlineMath math="p" /> par{" "}
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
          influencer le consensus final. Il peut aussi ajouter un bruit
          aléatoire pour perturber le processus de convergence.
        </TextBlock>

        <TextBlock>
          Non, 0 et n ne sont plus des états absorbants dans ce cas. En effet,
          même si tous les nœuds honnêtes ont la même opinion, les nœuds
          byzantins peuvent toujours choisir l&apos;opinion opposée, ce qui peut
          faire changer l&apos;effectif total. Cela est vraie à partir du moment
          où <InlineMath math="q > 0" />.
        </TextBlock>

        <TextBlock>
          On étudie uniquement le cas où le nœud sélectionné est honnête.
          Reprenons le raisonnement de la question 1, seul le nœud sélectionné
          peut changer l&apos;effectif total de 1. Ainsi:
          <BlockMath math="\overline{X}_{k+1} \in \{m-1, m, m+1\}" />
          On a alors deux cas en fonction de ce que pense la majorité des nœuds
          honnêtes. La majorité des nœuds honnêtes a l&apos;opinion 1 avec une
          probabilité <InlineMath math="\frac{\overline{X}_{k}}{(1-q)n}" />{" "}
          notons cela s. Raisonnons par disjonction de cas sur la majorité des
          nœuds honnêtes. <br />— Si la majorité des nœuds honnêtes a
          l&apos;opinion 1, pour que les 3 nœuds aient l&apos;opinion 1 il faut
          qu&apos;ils soient tous honnêtes et qu&apos;ils aient les 3
          l&apos;opinion 1. La probabilité de cet événement est donc{" "}
          <InlineMath math="(1-q)^3 s^3" />. pour que 2 nœuds aient
          l&apos;opinion 1 et 1 noeud l&apos;opinion 0, il y a deux
          possibilités: soit on a 3 nœuds honnêtes dont 2 ont l&apos;opinion 1
          et 1 a l&apos;opinion 0, soit on a 2 nœuds honnêtes avec
          l&apos;opinion 1 et 1 nœud byzantin (un nœud bizantin ne peut pas
          avoir l&apos;opinion 0 ici). La probabilité de cet événement est donc
          en sommant:
          <BlockMath math="(1-q)^3 s^2(1-s) + (1-q)^2 q s^2" />
          Ainsi dans par probabilité totale, la probabilité que le nœud
          sélectionné prenne l&apos;opinion 1 dans ce cas est:
          <BlockMath math="(1-q)^3 s^3 + (1-q)^3 s^2(1-s) + (1-q)^2 q s^2" />
          En simplifiant on trouve:
          <BlockMath math="(1-q)^2 s^2" />
          — Si la majorité des nœuds honnêtes a l&apos;opinion 0, pour que les 3
          nœuds aient l&apos;opinion 1. il y a 4 possibilités: soit les 3 nœuds
          sont bizantins. Cela a une probabilité de <InlineMath math="q^3" /> de
          se produire. Soit 2 nœuds sont byzantins et 1 nœud honnête avec
          l&apos;opinion 1. Cela a une probabilité de{" "}
          <InlineMath math="q^2(1-q)s" /> de se produire. Soit 1 nœud est
          byzantin et 2 nœuds honnêtes avec l&apos;opinion 1. Cela a une
          probabilité de <InlineMath math="q(1-q)^2 s^2" /> de se produire.
          Enfin, les 3 nœuds sont honnêtes avec l&apos;opinion 1. Cela a une
          probabilité de <InlineMath math="(1-q)^3 s^3" /> de se produire. La
          probabilité totale que les 3 nœuds aient l&apos;opinion 1 est donc la
          somme de ces 4 probabilités:
          <BlockMath math="q^3 + q^2(1-q)s + q(1-q)^2 s^2 + (1-q)^3 s^3" />
          Pour que 2 nœuds aient l&apos;opinion 1 et 1 noeud l&apos;opinion 0,
          il y a 3 possibilités (on ne peut pas avoir 3 nœuds bizantins). Soit 2
          nœuds bizantins et 1 nœud honnête avec l&apos;opinion 0. Cela a une
          probabilité de <InlineMath math="q^2(1-q)(1-s)" /> de se produire.
          Soit 1 nœud byzantin, 1 nœud honnête avec l&apos;opinion 1 et 1 nœud
          honnête avec l&apos;opinion 0. Cela a une probabilité de{" "}
          <InlineMath math="q(1-q)^2 s(1-s)" /> de se produire. Enfin, 3 nœuds
          honnêtes avec 2 ayant l&apos;opinion 1 et 1 ayant l&apos;opinion 0.
          Cela a une probabilité de <InlineMath math="(1-q)^3 s^2(1-s)" /> de se
          produire. La probabilité totale que 2 nœuds aient l&apos;opinion 1 et
          1 noeud l&apos;opinion 0 est donc la somme de ces 3 probabilités:
          <BlockMath math="q^2(1-q)(1-s) + q(1-q)^2 s(1-s) + (1-q)^3 s^2(1-s)" />
          Ainsi par probabilité totale, la probabilité que le nœud sélectionné
          prenne l&apos;opinion 1 dans ce cas est:
          <BlockMath math="q^3 + q^2(1-q)s + q(1-q)^2 s^2 + (1-q)^3 s^3 + q^2(1-q)(1-s) + q(1-q)^2 s(1-s) + (1-q)^3 s^2(1-s)" />
          qui se simplifie en:
          <BlockMath math="q^2 + (1-q)^2 s(q+(1-q)s)" />
          <br />
          En regroupant alors les deux cas en multipliant par les probabilités
          de chaque cas, on trouve que la probabilité que le nœud sélectionné
          prenne l&apos;opinion 1 est:
          <BlockMath math="s*(1-q)^2s^2+ (1-s)*(q^2 + (1-q)^2 s(q+(1-q)s))" />
          En développant et simplifiant, on trouve:
          <BlockMath math="s(1-q)^2(q(1-s)^2 +s) + (1-s)q^2" />
          Mais le noeud sélectionné a une probabilité <InlineMath math="s" />{" "}
          d&apos;avoir déjà l&apos;opinion 1 et donc de ne pas changer
          l&apos;effectif. Ainsi la probabilité que l&apos;effectif augmente de
          1 est:
          <BlockMath math="P(\overline{X}_{k+1} = m+1 | X_k = m) = (1-s)(s(1-q)^2(q(1-s)^2 +s) + (1-s)q^2)" />
          Par symétrie, la probabilité que l&apos;effectif diminue de 1 est la
          même:
          <BlockMath math="P(\overline{X}_{k+1} = m-1 | X_k = m) = s((1-s)(1-q)^2(qs^2 + (1-s)) + sq^2)" />
          Enfin, la probabilité que l&apos;effectif reste le même est:
          <BlockMath
            math={String.raw`
    \begin{aligned}
      P(\overline{X}_{k+1} = m \mid X_k = m)
        &= 1 - P(\overline{X}_{k+1} = m+1 \mid X_k = m)
           - P(\overline{X}_{k+1} = m-1 \mid X_k = m) \\
        &= 1 - (1-s)(s(1-q)^2(q(1-s)^2 +s) + (1-s)q^2) - s((1-s)(1-q)^2(qs^2 + (1-s)) + sq^2) \\
        &= 1 - (1-q)^2 \, s \, (1-s) \left[ 1 + q \left( s^2 + (1-s)^2 \right) \right] - q^2 \left( s^2 + (1-s)^2 \right) \\
    \end{aligned}
  `}
          />
          Finalement,
          <BlockMath
            math={String.raw`
    P(\overline{X}_{k+1} = m' \mid X_k = m)
    =
    \begin{cases}
      (1-s)(s(1-q)^2(q(1-s)^2 +s) + (1-s)q^2), & \text{si } m' = m+1, \\
      1 - (1-q)^2 \, s \, (1-s) \left[ 1 + q \left( s^2 + (1-s)^2 \right) \right] - q^2 \left( s^2 + (1-s)^2 \right), & \text{si } m' = m, \\
      s((1-s)(1-q)^2(qs^2 + (1-s)) + sq^2), & \text{si } m' = m-1, \\
      0 & \text{sinon.}
    \end{cases}
  `}
          />
          En remplaçant <InlineMath math="s" /> par{" "}
          <InlineMath math="\frac{\overline{X}_{k}}{(1-q)n}" />, on obtient le
          résultat:
          <BlockMath
            math={String.raw`
    P(\overline{X}_{k+1} = m' \mid X_k = m)
    =
    \begin{cases}
      (1-\frac{m}{(1-q)n})(\frac{m}{(1-q)n}(1-q)^2(q(1-\frac{m}{(1-q)n})^2 +\frac{m}{(1-q)n}) + (1-\frac{m}{(1-q)n})q^2), & \text{si } m' = m+1, \\
      1 - (1-q)^2 \, \frac{m}{(1-q)n} \, (1-\frac{m}{(1-q)n}) \left[ 1 + q \left( (\frac{m}{(1-q)n})^2 + (1-\frac{m}{(1-q)n})^2 \right) \right] - q^2 \left( (\frac{m}{(1-q)n})^2 + (1-\frac{m}{(1-q)n})^2 \right), & \text{si } m' = m, \\
      \frac{m}{(1-q)n}((1-\frac{m}{(1-q)n})(1-q)^2(q(\frac{m}{(1-q)n})^2 + (1-\frac{m}{(1-q)n})) + \frac{m}{(1-q)n}q^2), & \text{si } m' = m-1, \\
      0 & \text{sinon.}
    \end{cases}
  `}
          />
        </TextBlock>

        <h2 className="text-2xl font-semibold text-gray-800">
          2 — Implementations of the fast probabilistic consensus
        </h2>

        <h3 className="text-xl font-semibold text-gray-700">Question 5 —</h3>
      </div>
    </div>
  );
};

export default Lab5Page;
