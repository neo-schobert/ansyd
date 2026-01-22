"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type DocLink = { label: string; href: string };
type SlideData = {
  title: string;
  subtitle?: string;
  bullets?: string[];
  docs?: DocLink[];
  image?: string;
};

const slides: SlideData[] = [
  {
    title:
      "Automated common vulnerabilities and exposures detection (CVEs)  with Large language Models (LLMs)",
    subtitle: "Projet Complexe IMT Atlantique - Soutenance",
    bullets: [
      "SCHOBERT Néo • AYOUBI Houcine • El AKRABA Othmane • IDRISSA Traoré",
    ],
    docs: [],
    image: "/images/logoIMTA.png",
  },
  {
    title: "Plan de la présentation",
    bullets: [
      "I - Contextualisation du projet",
      "II - Choix Techniques",
      "III - Avancement du projet et gestion des imprévus",
      "IV - Résultats et perspectives",
    ],
  },
  {
    title: "I - Contextualisation du projet",
    subtitle: "Contexte général",
    image: "/images/contexte general.png",
  },
  {
    title: "I - Contextualisation du projet",
    subtitle: "Reformulation du sujet",
    bullets: [
      "Objectif principal : Développer un pipeline automatisé pour détecter les vulnérabilités logicielles (CVEs) en utilisant des modèles de langage avancés (LLMs)",
      "Étapes clés : Extraction des dépendances, identification des CVEs, analyse structurelle du code, génération de visualisations et explications XAI",
      "Technologies envisagées : Ollama pour l’exécution locale de LLMs, Unsloth pour le fine-tuning, outils d’analyse statique pour le code C/C++",
    ],
    docs: [
      {
        label: "Reformulation du sujet",
        href: "/docs/reformulation.pdf",
      },
    ],
  },
  {
    title: "II - Choix Techniques",
    subtitle: "Hypothèses",
    bullets: [
      // Hypothèses
      "Hypothèses techniques : accès aux fichiers CMake et au code source C/C++, disponibilité des dépendances et versions correctes",
      "Hypothèses organisationnelles : ressources matérielles suffisantes (GPU local, RAM, CPU) pour exécution des modèles IA et analyse des fichiers",
      "Hypothèses sur les données : CVE publiques disponibles et à jour via NVD/NIST et OSV.dev, code source analysable",
      "Hypothèses sur les modèles IA : possibilité d’exécution locale d’Ollama et fine-tuning avec Unsloth",
    ],
    docs: [],
  },
  {
    title: "II - Choix Techniques",
    subtitle: "Périmètre",
    bullets: [
      "Fonctionnalités incluses : extraction des dépendances, identification des CVE, analyse structurelle du code, construction du contexte d’appel, génération de visualisation et explications XAI",
      "Fonctionnalités exclues : intégration continue complète, prédiction de vulnérabilités non référencées, remédiation automatique",
      "Contraintes temporelles : démonstration complète du pipeline sur un projet représentatif, traitement limité à des fichiers de test et démonstration interactive",
    ],
    docs: [],
  },
  {
    title: "II - Choix Techniques",
    subtitle: "Architecture du système",
    image: "/images/choix techniques.png",
  },
  {
    title: "III - Avancement du projet et gestion des imprévus",
    subtitle: "Évaluation des risques",
    bullets: [
      "Identification des risques majeurs techniques et organisationnels",
      "Impact potentiel et probabilité",
      "Stratégies de mitigation et plan de prévention",
    ],
    docs: [
      {
        label: "Évaluation des risques",
        href: "/docs/evaluation-des-risques.jpeg",
      },
      {
        label: "Évaluation des risques (au sein du groupe)",
        href: "/procom/soutenance/risques-equipe",
      },
    ],
  },
  {
    title: "III - Avancement du projet et gestion des imprévus",
    subtitle: "Diagramme de Gantt",
    bullets: [
      "Planification initiale des tâches et jalons clés",
      "Suivi de l’avancement et ajustements en fonction des imprévus",
      "Suite du projet et prochaines étapes",
    ],
    docs: [
      {
        label: "Diagramme de Gantt",
        href: "https://projet-complexe.atlassian.net/jira/core/projects/PC/timeline?rangeMode=quarters",
      },
    ],
  },
  {
    title: "IV - Résultats et perspectives",
    subtitle: "Démonstration",
    bullets: [
      "Présentation du pipeline automatisé pour la détection des CVEs",
      "Exemples concrets d’analyse de projets C/C++",
      "Visualisations générées et explications XAI",
    ],
    docs: [
      {
        label: "Démonstration en direct",
        href: "/procom",
      },
    ],
  },
  {
    title: "IV - Résultats et perspectives",
    subtitle: "Perspectives",
    bullets: [],
    docs: [],
  },
  {
    title: "Conclusion",
    bullets: [
      "Cadrage initial solide et suivi rigoureux sont clés pour le succès d’un projet complexe.",
      "Adaptabilité et communication efficace avec l’équipe et le client sont essentielles.",
      "Outils Agile facilitent la gestion des imprévus et maintiennent l’alignement sur les objectifs.",
    ],
    docs: [],
  },
  {
    title: "Merci pour votre attention !",
    bullets: ["Des questions ?"],
    docs: [],
  },
];

// -------------------
// Boutons documents stylés
// -------------------
function DocButton({ href, label }: DocLink) {
  return (
    <a
      href={href}
      target="_blank"
      className="px-5 py-2 bg-[#2596be] text-white font-semibold rounded-full shadow-lg hover:scale-105 hover:shadow-2xl transition transform"
    >
      {label}
    </a>
  );
}

// -------------------
// Slide pro charte IMT
// -------------------
function Slide({
  data,
  index,
  total,
}: {
  data: SlideData;
  index: number;
  total: number;
}) {
  return (
    <div className="h-full w-full flex flex-col justify-between items-center bg-[#2596be] text-white relative">
      {/* Barre en haut avec logo et slide tracker */}
      <div className="w-full flex justify-between items-center bg-white py-4 px-6 absolute top-0 left-0">
        <img src="/images/logoIMTA.png" alt="Logo IMT" className="h-12" />
        <span className="font-semibold text-lg text-[#2596be]">{`Slide ${
          index + 1
        } / ${total}`}</span>
      </div>

      {/* Contenu central */}
      <div className="flex flex-col justify-center items-center text-center mt-32">
        <header className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 drop-shadow-lg">
            {data.title}
          </h1>
          {data.subtitle && (
            <p className="text-2xl italic opacity-90 drop-shadow">
              {data.subtitle}
            </p>
          )}
        </header>

        <ul className="space-y-6 w-full max-w-3xl">
          {data.bullets?.map((item, idx) => (
            <li
              key={idx}
              className="bg-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl text-2xl font-semibold animate-fadeIn"
              style={{
                animationDelay: `${idx * 250}ms`,
                animationFillMode: "forwards",
              }}
            >
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 w-full max-w-6xl">
          {data.image && (
            <img
              src={data.image}
              alt="Slide Image"
              className="max-h-120 object-contain mx-auto animate-fadeIn"
              style={{ animationDelay: `${data.bullets?.length! * 250}ms` }}
            />
          )}
        </div>
      </div>

      {/* Documents et membres en bas */}
      <div className="flex justify-between items-center w-full bg-white py-6 pl-24 pr-12">
        <div className="flex gap-6 flex-wrap">
          {data.docs?.map((doc, idx) => (
            <DocButton key={idx} {...doc} />
          ))}
        </div>
        <div className="text-[#2596be] text-sm font-semibold">
          SCHOBERT Néo • AYOUBI Houcine • El AKRABA Othmane • IDRISSA Traoré
        </div>
      </div>
    </div>
  );
}

// -------------------
// Animation fade + slide up
// -------------------
const style = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { opacity: 0; animation: fadeIn 0.6s ease forwards; }
/* Couleur par défaut (slides 1 → 2) */
.swiper-pagination-bullet {
  background-color: #ccc; /* bleu IMT */
  opacity: 0.5;
}

/* Slide active (1 → 2) */
.swiper-pagination-bullet-active {
  opacity: 1;
}

/* À partir de la 3e slide */
.swiper-pagination-bullet:nth-child(n + 3) {
  background-color: #FFB7AB; /* bleu plus clair */
}

/* Active à partir de la 3e */
.swiper-pagination-bullet:nth-child(n + 3).swiper-pagination-bullet-active {
  background-color: #FF2900; /* bleu plus soutenu */
  opacity: 1;
}
  /* À partir de la 5e slide */
.swiper-pagination-bullet:nth-child(n + 5) {
  background-color: #1e40af ; /* bleu plus clair */
  opacity: 0.5;
}

/* Active à partir de la 5e */
.swiper-pagination-bullet:nth-child(n + 5).swiper-pagination-bullet-active {
  background-color: #1e40af; /* bleu plus soutenu */
  opacity: 1;
}
    /* À partir de la 8e slide */
.swiper-pagination-bullet:nth-child(n + 8) {
  background-color: #008000 ; /* vert */
  opacity: 0.5;
}

/* Active à partir de la 8e */
.swiper-pagination-bullet:nth-child(n + 8).swiper-pagination-bullet-active {
  background-color: #008000; /* vert */
  opacity: 1;
}
      /* À partir de la 13e slide */
.swiper-pagination-bullet:nth-child(n + 13) {
  background-color: #FFA500 ; /* orange */
  opacity: 0.5;
}

/* Active à partir de la 13e */
.swiper-pagination-bullet:nth-child(n + 13).swiper-pagination-bullet-active {
  background-color: #FFA500; /* orange */
  opacity: 1;
}
`;

export default function Page() {
  return (
    <>
      <style>{style}</style>
      <main className="h-screen w-screen">
        <Swiper
          modules={[Navigation, Pagination, Keyboard]}
          navigation
          pagination={{ clickable: true }}
          keyboard={{ enabled: true }}
          className="h-full"
        >
          {slides.map((slide, idx) => (
            <SwiperSlide key={idx}>
              <Slide data={slide} index={idx} total={slides.length} />
            </SwiperSlide>
          ))}
        </Swiper>
      </main>
    </>
  );
}
