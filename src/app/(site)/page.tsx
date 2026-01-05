// app/page.tsx

import { TextBlock } from "@/components/TextBlock";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-gray-100 to-gray-50 p-6 pt-40">
      <div className="max-w-5xl mx-auto space-y-12">
        <h1 className="text-5xl font-bold text-gray-900 text-center mb-12">
          ANSYD
        </h1>

        <TextBlock>
          Ce site regroupe l’ensemble des labs réalisés dans le cadre de la
          matière ANSYD. Chaque lab contient le code source en Go correspondant
          aux exercices demandés ainsi que la possibilité de visualiser les
          résultats en direct via le backend sur Google Cloud Run.
        </TextBlock>

        <TextBlock>
          L’objectif du site est de centraliser les travaux pour faciliter la
          consultation et la vérification par les enseignants. Chaque lab est
          présenté avec un résumé de son contenu, les fichiers de code, et les
          résultats générés lors de l’exécution.
        </TextBlock>

        <TextBlock>
          <strong>Fonctionnement du backend :</strong>
          <ul className="list-disc ml-6 mt-2">
            <li>
              Le backend est packagé dans un conteneur Docker et déployé sur
              Google Cloud Run.
            </li>
            <li>
              Chaque lab et chaque question correspond à une fonction Go déjà
              implémentée sur le serveur.
            </li>
            <li>
              Le site appelle ces fonctions via des endpoints spécifiques pour
              récupérer le résultat de l’exécution.
            </li>
            <li>
              Pendant l’exécution, les logs générés sont concaténés pour être
              renvoyés en une seule réponse, permettant de visualiser
              l’exécution complète sans nécessiter de multiples appels.
            </li>
            <li>
              Cloud Run assure l’isolation et la scalabilité des fonctions,
              garantissant que chaque exécution reste indépendante et sécurisée.
            </li>
          </ul>
        </TextBlock>
      </div>
    </div>
  );
}
