"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface Job {
  id: number;
  worker: 1 | 2;
  done: boolean;
}

const JOBS: Job[] = [
  { id: 1, worker: 1, done: false },
  { id: 2, worker: 1, done: false },
  { id: 3, worker: 1, done: false },
];

export const ArchitectureQ1 = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [trigger, setTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [jobSize, setJobSize] = useState(48);
  const margin = 48;

  useEffect(() => {
    const checkMobile = () => {
      setJobSize(window.innerWidth <= 640 ? 10 : 48);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [containerWidth, setContainerWidth] = useState(0);

  const updateWidth = () => {
    if (containerRef.current)
      setContainerWidth(containerRef.current.offsetWidth);
  };

  useEffect(() => {
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // random assign jobs
  useEffect(() => {
    setJobs([]);
    const shuffledWorkers: (1 | 2)[] = [];

    // garantir qu'au moins un job pour chaque worker
    shuffledWorkers.push(1);
    shuffledWorkers.push(2);

    // pour les jobs restants
    for (let i = 2; i < JOBS.length; i++) {
      shuffledWorkers.push(Math.random() < 0.5 ? 1 : 2);
    }

    // shuffle léger pour varier l'ordre
    for (let i = shuffledWorkers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledWorkers[i], shuffledWorkers[j]] = [
        shuffledWorkers[j],
        shuffledWorkers[i],
      ];
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i < JOBS.length) {
        const newJob: Job = {
          ...JOBS[i],
          worker: shuffledWorkers[i],
          done: false,
        };
        setJobs((prev) => [...prev, newJob]);
        i++;
      } else clearInterval(interval);
    }, 700);

    return () => clearInterval(interval);
  }, [trigger]);

  const handleAnimationComplete = (jobId: number) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, done: true } : job))
    );
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl h-[400px] border rounded-xl bg-linear-to-b from-gray-50 to-gray-200 p-6 shadow-lg overflow-hidden"
      >
        {/* Main goroutine */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center font-bold text-xl text-gray-800">
          Main
        </div>

        {/* Workers */}
        <div className="absolute left-12 bottom-12 font-bold text-gray-700 text-lg">
          Worker 1
        </div>
        <div className="absolute right-12 bottom-12 font-bold text-gray-700 text-lg">
          Worker 2
        </div>

        {/* Jobs animés */}
        {containerWidth > 0 &&
          jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{
                top: 30,
                left: containerWidth / 2 - jobSize / 2,
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                top: 180,
                left: (() => {
                  const sameWorkerJobs = jobs.filter(
                    (j) => j.worker === job.worker
                  );
                  const idxInWorker = sameWorkerJobs.findIndex(
                    (j) => j.id === job.id
                  );
                  if (job.worker === 1) {
                    return margin + idxInWorker * (jobSize + 10);
                  } else {
                    return (
                      containerWidth -
                      margin -
                      jobSize -
                      idxInWorker * (jobSize + 10)
                    );
                  }
                })(),
                scale: 1,
                opacity: 1,
              }}
              transition={{ duration: 1.3, type: "spring", stiffness: 60 }}
              onAnimationComplete={() => handleAnimationComplete(job.id)}
              className={`absolute flex items-center justify-center rounded-full text-xs md:text-base h-6 w-6 md:w-12 md:h-12 font-bold text-white shadow-md ${
                job.done ? "bg-green-500" : "bg-blue-500"
              }`}
            >
              {job.id}
            </motion.div>
          ))}

        {/* Done indicators */}
        <div className="absolute left-12 bottom-4 text-green-600 font-semibold">
          {jobs.filter((j) => j.worker === 1).every((j) => !j.done)
            ? ""
            : jobs.some((j) => j.worker === 1 && !j.done)
            ? "Done 1"
            : "All Done 1"}
        </div>
        <div className="absolute right-12 bottom-4 text-green-600 font-semibold">
          {jobs.filter((j) => j.worker === 2).every((j) => !j.done)
            ? ""
            : jobs.some((j) => j.worker === 2 && !j.done)
            ? "Done 2"
            : "All Done 2"}
        </div>

        {/* Refresh button */}
        <div className="absolute left-1/2 bottom-4 -translate-x-1/2">
          <button
            className="px-4 py-4 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition"
            onClick={() => setTrigger((prev) => prev + 1)}
          >
            <ArrowPathIcon className="inline-block w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
