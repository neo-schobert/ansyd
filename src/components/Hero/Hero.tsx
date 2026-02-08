import React, { MouseEventHandler, useEffect, useRef, useState } from "react";

type HeroProps = {
  descriptive: string;
  title: React.ReactNode;
  description: React.ReactNode;
  bouton1Text?: string;
  bouton2Text?: string;
  bouton1OnClick?: MouseEventHandler<HTMLButtonElement>;
  bouton2OnClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  isBlackTheme?: boolean;
  isTopPage?: boolean;
};

const Hero: React.FC<HeroProps> = ({
  descriptive,
  title,
  description,
  bouton1Text,
  bouton2Text,
  bouton1OnClick,
  bouton2OnClick,
  className,
  isBlackTheme = false,
  isTopPage = false,
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Gérer l'animation au chargement de la page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isTopPage) {
        setIsVisible(true);
      }
    }, 100); // Petit délai pour s'assurer que l'animation est visible après le rendu initial

    return () => clearTimeout(timer); // Nettoyage
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top <= windowHeight - 100 && !isVisible) {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVisible]);

  return (
    <div>
      <section
        ref={heroRef}
        className={`w-full pt-10  flex flex-col justify-center items-center text-center p-4 transition-all duration-700 ease-out transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
        } ${className}`}
      >
        <h1
          className={` ${
            isBlackTheme ? "text-gray-300" : "text-gray-500"
          } text-xs md:text-xl uppercase tracking-widest mb-2`}
        >
          {descriptive}
        </h1>
        <div
          className={`${
            isBlackTheme ? "text-white" : "text-black"
          } text-4xl md:text-6xl font-bold mb-4`}
        >
          {title}
        </div>
        <h2
          className={`${
            isBlackTheme ? "text-gray-300" : "text-gray-500"
          } max-w-2xl ${bouton1Text || bouton2Text ? "mb-8" : ""}`}
        >
          {description}
        </h2>
        {bouton1Text || bouton2Text ? (
          <div className="flex mt-10 space-x-4">
            {bouton1Text ? (
              <button
                onClick={bouton1OnClick}
                className="bg-white text-black text-xs md:text-sm cursor-pointer font-bold py-4 px-8 rounded-lg shadow-[0px_10px_25px_rgba(0,0,0,0.15)] transition transform hover:-translate-y-2 hover:shadow-[0px_10px_25px_rgba(0,0,0,0.3)] active:translate-y-0 active:shadow-md"
              >
                {bouton1Text}
              </button>
            ) : (
              <></>
            )}

            {bouton2Text ? (
              <button
                onClick={bouton2OnClick}
                className={`${
                  isBlackTheme ? "text-white" : "text-black"
                } bg-gradient-to-r from-[#f99c01] to-[#fa3001] cursor-pointer text-xs md:text-sm font-bold py-4 px-8 rounded-lg shadow-[0px_10px_25px_rgba(0,0,0,0.15)] hover:shadow-[0px_10px_25px_rgba(0,0,0,0.3)] transition transform hover:-translate-y-2`}
              >
                {bouton2Text}
              </button>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <></>
        )}
      </section>
    </div>
  );
};

export default Hero;
