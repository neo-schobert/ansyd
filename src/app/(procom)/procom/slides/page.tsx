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
  bullets: string[];
  docs: DocLink[];
};

const slides: SlideData[] = [
  {
    title: "Séance 1 — Introduction",
    subtitle: "Cadrage du projet et sécurisation de l'exécution",
    bullets: [
      "Objectif : cadrer le projet et sécuriser l’exécution.",
      "- Cadrage : sujet reformulé, hypothèses, périmètre, risques majeurs.",
      "- Roadmap : Gantt simplifié, jalons clés, responsabilités.",
      "- Charte d’équipe : rôles, outils, format des comptes rendus.",
    ],
    docs: [],
  },
  {
    title: "Séance 1 — Reformulation du sujet",
    bullets: [
      "Analyse du sujet initial pour en clarifier la portée",
      "Identification des attentes de l'entreprise",
      "Définition des livrables attendus",
    ],
    docs: [
      {
        label: "Reformulation du sujet",
        href: "/docs/reformulation.pdf",
      },
    ],
  },
  {
    title: "Séance 1 — Hypothèses",
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
    title: "Séance 1 — Périmètre",
    bullets: [
      "Fonctionnalités incluses : extraction des dépendances, identification des CVE, analyse structurelle du code, construction du contexte d’appel, génération de visualisation et explications XAI",
      "Fonctionnalités exclues : intégration continue complète, prédiction de vulnérabilités non référencées, remédiation automatique",
      "Contraintes temporelles : démonstration complète du pipeline sur un projet représentatif, traitement limité à des fichiers de test et démonstration interactive",
    ],
    docs: [],
  },
  {
    title: "Séance 1 — Évaluation des risques",
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
        href: "/procom/risques-equipe",
      },
    ],
  },
  {
    title: "Séance 1 — Roadmap",
    bullets: [
      "Découpage du projet en étapes et jalons clés",
      "Ordre chronologique et priorisation",
      "Indication des responsabilités par tâche",
    ],
    docs: [{ label: "Roadmap", href: "/procom/roadmap" }],
  },
  {
    title: "Séance 1 — Diagramme de Gantt",
    bullets: [
      "Visualisation de la planification sur la durée",
      "Suivi de l'avancement par rapport aux jalons",
      "Identification des chevauchements et dépendances",
    ],
    docs: [
      {
        label: "Diagramme de Gantt",
        href: "https://projet-complexe.atlassian.net/jira/core/projects/PC/timeline?rangeMode=quarters",
      },
    ],
  },
  {
    title: "Séance 1 — Charte d'équipe",
    bullets: [
      "Définition des rôles et responsabilités",
      "Outils utilisés pour le suivi et la collaboration",
      "Format et fréquence des comptes rendus",
    ],
    docs: [{ label: "Charte d'équipe", href: "/docs/charte.pdf" }],
  },
  {
    title: "Séance 2 — Introduction",
    subtitle: "Suivi du projet",
    bullets: [
      "Objectif : vérifier l’exécution et la réactivité face aux aléas.",
      "- Évaluer la cohérence entre avancement et jalons.",
      "- Réactivité aux imprévus.",
      "- Qualité de la collaboration et des documents.",
    ],
    docs: [],
  },
  {
    title: "Séance 2 — Diagramme de Gantt (Suivi)",
    bullets: [
      "Evaluation de l'avancement par rapport au planning initial",
      "Identification des écarts et ajustements nécessaires",
      "Analyse de l'impact des imprévus sur le calendrier",
    ],
    docs: [
      {
        label: "Diagramme de Gantt",
        href: "https://projet-complexe.atlassian.net/jira/core/projects/PC/timeline?rangeMode=quarters",
      },
    ],
  },
  {
    title: "Séance 2 — Gestion de projet Agile",
    bullets: [
      "Utilisation d'outils Agile pour gérer les imprevus",
      "Adaptation de la roadmap en fonction des retours clients...",
      "Régularité des points d'équipe et ajustements",
    ],
    docs: [
      {
        label: "Diagramme de Gantt",
        href: "https://projet-complexe.atlassian.net/jira/core/projects/PC/timeline?rangeMode=quarters",
      },
    ],
  },
  {
    title: "Séance 2 — Qualité de la collaboration au sein de l'équipe",
    bullets: [
      "Parfois difficile de rester tous motivés et alignés sur les objectifs (emplois du temps chargés, priorités divergentes)...",
      "Respect des rôles et responsabilités définis dans la charte",
      "La régularité des points d'équipe aide à maintenir la cohésion et l'alignement",
    ],
    docs: [{ label: "Charte d'équipe", href: "/docs/charte.pdf" }],
  },
  {
    title: "Séance 2 — Qualité de la collaboration avec le client",
    bullets: [
      "Communication régulière avec le client pour s'assurer que les attentes sont claires et alignées (quasiment hebdomadaire)...",
      "Adaptation aux retours du client pour ajuster la direction du projet si nécessaire",
      "Documentation claire et complète des décisions et changements pour éviter les malentendus",
    ],
    docs: [
      {
        label: "Document de spécification",
        href: "https://docs.google.com/document/d/122tbkFqAHWpDlINRgwARYEx51BCakrfJhY-sCKDwulg/edit?tab=t.0",
      },
    ],
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
          {data.bullets.map((item, idx) => (
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
      </div>

      {/* Documents et membres en bas */}
      <div className="flex justify-between items-center w-full bg-white py-6 pl-24 pr-12">
        <div className="flex gap-6 flex-wrap">
          {data.docs.map((doc, idx) => (
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
/* Couleur par défaut (slides 1 → 8) */
.swiper-pagination-bullet {
  background-color: #1e40af; /* bleu IMT */
  opacity: 0.5;
}

/* Slide active (1 → 8) */
.swiper-pagination-bullet-active {
  opacity: 1;
}

/* À partir de la 9e slide */
.swiper-pagination-bullet:nth-child(n + 9) {
  background-color: #FFB7AB; /* bleu plus clair */
}

/* Active à partir de la 9e */
.swiper-pagination-bullet:nth-child(n + 9).swiper-pagination-bullet-active {
  background-color: #FF2900; /* bleu plus soutenu */
  opacity: 1;
}
  /* À partir de la 14e slide */
.swiper-pagination-bullet:nth-child(n + 14) {
  background-color: #ccc; /* bleu plus clair */
}

/* Active à partir de la 14e */
.swiper-pagination-bullet:nth-child(n + 14).swiper-pagination-bullet-active {
  background-color: #000; /* bleu plus soutenu */
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
