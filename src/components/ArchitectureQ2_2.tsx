"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface Job {
  id: number;
  done: boolean;
}

const JOBS: Job[] = [
  { id: 1, done: false },
  { id: 2, done: false },
  { id: 3, done: false },
];

export const ArchitectureQ2_2 = () => {
  const [jobsW1, setJobsW1] = useState<Job[]>([]);
  const [jobsW2, setJobsW2] = useState<Job[]>([]);
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

  useEffect(() => {
    setJobsW1([]);
    setJobsW2([]);
    // Broadcast simulation : W2 d'abord, puis W1
    JOBS.forEach((job, idx) => {
      setTimeout(
        () => setJobsW2((prev) => [...prev, { ...job, done: false }]),
        700 * idx
      );
      setTimeout(
        () => setJobsW1((prev) => [...prev, { ...job, done: false }]),
        700 * idx + JOBS.length * 700 // délai pour que W1 commence après que W2 ait reçu tous les jobs
      );
    });
  }, [trigger]);

  const handleComplete = (worker: 1 | 2, jobId: number) => {
    if (worker === 1)
      setJobsW1((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, done: true } : j))
      );
    else
      setJobsW2((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, done: true } : j))
      );
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl h-[400px] border rounded-xl bg-linear-to-b from-gray-50 to-gray-200 p-6 shadow-lg overflow-hidden"
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 font-bold text-xl text-gray-800">
          Main
        </div>
        <div className="absolute left-12 bottom-12 font-bold text-gray-700 text-lg">
          Worker 1
        </div>
        <div className="absolute right-12 bottom-12 font-bold text-gray-700 text-lg">
          Worker 2
        </div>

        {containerWidth > 0 &&
          jobsW1.map((job, idx) => (
            <motion.div
              key={`${idx}-w1-${job.id}`}
              initial={{
                top: 30,
                left: containerWidth / 2 - jobSize / 2,
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                top: 180,
                left: margin + idx * (jobSize + 10),
                scale: 1,
                opacity: 1,
              }}
              transition={{ duration: 1.2, type: "spring", stiffness: 60 }}
              onAnimationComplete={() => handleComplete(1, job.id)}
              className={`absolute flex items-center justify-center rounded-full text-xs md:text-base h-6 w-6 md:w-12 md:h-12 font-bold text-white shadow-md ${
                job.done ? "bg-green-500" : "bg-blue-500"
              }`}
            >
              {job.id}
            </motion.div>
          ))}

        {containerWidth > 0 &&
          jobsW2.map((job, idx) => (
            <motion.div
              key={`${idx}-w2-${job.id}`}
              initial={{
                top: 30,
                left: containerWidth / 2 - jobSize / 2,
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                top: 180,
                left: containerWidth - margin - jobSize - idx * (jobSize + 10),
                scale: 1,
                opacity: 1,
              }}
              transition={{ duration: 1.2, type: "spring", stiffness: 60 }}
              onAnimationComplete={() => handleComplete(2, job.id)}
              className={`absolute flex items-center justify-center rounded-full text-xs md:text-base h-6 w-6 md:w-12 md:h-12 font-bold text-white shadow-md ${
                job.done ? "bg-green-500" : "bg-blue-500"
              }`}
            >
              {job.id}
            </motion.div>
          ))}

        <div className="absolute left-12 bottom-4 text-green-600 font-semibold">
          {jobsW1.every((j) => j.done)
            ? "All Done 1"
            : jobsW1.some((j) => j.done)
            ? "Done 1"
            : ""}
        </div>
        <div className="absolute right-12 bottom-4 text-green-600 font-semibold">
          {jobsW2.every((j) => j.done)
            ? "All Done 2"
            : jobsW2.some((j) => j.done)
            ? "Done 2"
            : ""}
        </div>

        <div className="absolute left-1/2 bottom-4 -translate-x-1/2">
          <button
            className="px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={() => setTrigger((prev) => prev + 1)}
          >
            <ArrowPathIcon className="inline-block w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
