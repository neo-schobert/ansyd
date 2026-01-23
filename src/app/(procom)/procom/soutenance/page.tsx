"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type DocLink = { label: string; href: string };
type SlideData = {
  title?: string;
  subtitle?: string;
  bullets?: React.ReactElement[];
  docs?: DocLink[];
  image?: string;
  isImageFullScreen?: boolean;
  imageStyle?: string;
};

export const ObjectifsTable = (
  objectifs: [string, "Terminé" | "En cours"][]
) => {
  return (
    <div className="flex flex-col gap-2">
      {objectifs.map(([objectif, etat], index) => {
        const etatColor =
          etat === "Terminé" ? "bg-green-600" : "bg-yellow-500 text-black";

        return (
          <div
            key={index}
            className="flex items-center justify-between border border-gray-700 bg-zinc-800 text-white rounded-xl shadow-md px-4 py-3 hover:scale-105 transition-transform"
          >
            <span className="flex-1 text-center">{objectif}</span>
            <span className="border-l border-gray-600 mx-4 h-6"></span>
            <span
              className={`flex-1 text-center font-semibold px-2 py-1 rounded ${etatColor}`}
            >
              {etat}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const slides: SlideData[] = [
  {
    title:
      "Automated common vulnerabilities and exposures detection (CVEs)  with Large language Models (LLMs)",
    subtitle: "Projet Complexe IMT Atlantique - Soutenance",
    bullets: [
      <>SCHOBERT Néo • AYOUBI Houcine • El AKRABA Othmane • IDRISSA Traoré</>,
    ],
    docs: [],
    image: "/images/logoIMTA.png",
    imageStyle: "max-h-40",
  },
  {
    title: "Plan de la présentation",
    bullets: [
      <>I - Contextualisation du projet</>,
      <>II - Choix Techniques</>,
      <>III - Résultats, Avancement et Perspectives</>,
    ],
  },
  {
    title: "I - Contextualisation du projet",
    subtitle: "Contexte général",
    image: "/images/contexte general.png",
    imageStyle: "max-h-150",
  },
  {
    title: "I - Contextualisation du projet",
    subtitle: "Reformulation du sujet",
    bullets: [
      <>
        Objectif principal : Développer un pipeline automatisé pour détecter les
        vulnérabilités logicielles (CVEs) en utilisant des modèles de langage
        avancés (LLMs)
      </>,
      <>
        Étapes clés : Extraction des dépendances, identification des CVEs,
        analyse structurelle du code, génération de visualisations et
        explications XAI
      </>,
      <>
        Technologies envisagées : Ollama pour l’exécution locale de LLMs,
        Unsloth pour le fine-tuning, outils d’analyse statique pour le code
        C/C++
      </>,
    ],
    docs: [
      {
        label: "Reformulation du sujet",
        href: "/docs/reformulation.pdf",
      },
    ],
  },
  {
    image: "/images/hypotheses.jpeg",
    isImageFullScreen: true,
  },
  {
    image: "/images/perimetre.jpeg",
    isImageFullScreen: true,
  },
  {
    title: "II - Choix Techniques",
    subtitle: "Architecture du système",
    image: "/images/choix techniques.png",
    imageStyle: "max-h-150",
  },
  {
    title: "III - Résultats, Avancement et Perspectives",
    subtitle: "Démonstration",
    bullets: [
      <>Présentation du pipeline automatisé pour la détection des CVEs</>,
      <>Exemples concrets d’analyse de projets C/C++</>,
      <>Visualisations générées et explications XAI</>,
    ],
    docs: [
      {
        label: "Démonstration en direct",
        href: "/procom",
      },
    ],
  },

  {
    title: "III - Résultats, Avancement et Perspectives",
    subtitle: "Avancement et Perspectives",
    bullets: [
      ObjectifsTable([
        [
          "Détection des bibliothèques vulnérables et leurs CVE associées",
          "Terminé",
        ],
        ["Identification des fonctions vulnérables", "Terminé"],
        ["Rédaction d’un rapport général", "Terminé"],
        ["Mise en place de Métriques", "En cours"],
        ["Rédaction d’un rapport ciblé", "En cours"],
        ["Rédaction de tests", "En cours"],
        ["Recommandation de solutions (optionnel)", "En cours"],
      ]),
    ],
    docs: [],
  },
  {
    title: "III - Résultats, Avancement et Perspectives",
    subtitle: "Evaluation des Risques",
    image: "/images/risques.png",
    imageStyle: "max-h-150",
  },
  {
    title: "III - Résultats, Avancement et Perspectives",
    subtitle: "Pistes d'amélioration",
    bullets: [
      <>Tronquage du code concerné par la vulnérabilité</>,
      <>Gain en précision sur le prompt donné aux LLMs</>,
      <>Pourrait avoir un effets positifs dans le cadre des LLMs Locaux</>,
    ],
    docs: [
      {
        label: "Exemple de piste d'amélioration",
        href: "https://www.canva.com/design/DAG_IVoBD_s/s9QQ8vv3JewfN0dHJ4TwMA/edit",
      },
    ],
  },
  {
    title: "Conclusion",
    bullets: [
      <>Pipeline automatisé de détection de CVEs opérationnel</>,
      <>Vulnérabilités identifiées avec visualisations explicatives</>,
      <>Objectifs principaux atteints</>,
      <>Perspectives : tests, métriques et automatisation supplémentaires</>,
    ],
    docs: [{ label: "Rapport final", href: "/docs/rapport_final.pdf" }],
  },
  {
    title: "Merci pour votre attention !",
    bullets: [<>Des questions ?</>],
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
      <div
        className={`flex flex-col justify-start items-center text-center w-full ${
          data.isImageFullScreen ? "mt-16" : "mt-32"
        }`}
      >
        <header className={`${data.isImageFullScreen ? "mb-0" : "mb-12"}`}>
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

        {/* Image */}
        {data.image && (
          <div
            className={`w-full flex justify-center items-center ${
              data.isImageFullScreen ? "flex-1" : "mt-8"
            }`}
          >
            <img
              src={data.image}
              alt="Slide Image"
              className={` h-full ${
                data.isImageFullScreen
                  ? " w-full object-contain mt-16 px-24"
                  : "object-contain" + data.imageStyle
                  ? data.imageStyle
                  : " max-h-120"
              } animate-fadeIn`}
              style={{
                animationDelay: `${(data.bullets?.length ?? 0) * 250}ms`,
              }}
            />
          </div>
        )}
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
      /* À partir de la 10e slide */
.swiper-pagination-bullet:nth-child(n + 10) {
  background-color: #ccc ; /* vert */
  opacity: 0.5;
}

/* Active à partir de la 10e */
.swiper-pagination-bullet:nth-child(n + 10).swiper-pagination-bullet-active {
  background-color: #ccc; /* vert */
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
