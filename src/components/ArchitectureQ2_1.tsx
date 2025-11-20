"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface Job {
  id: number;
  done1: boolean;
  done2: boolean;
}

const JOBS: Job[] = [
  { id: 1, done1: false, done2: false },
  { id: 2, done1: false, done2: false },
  { id: 3, done1: false, done2: false },
];

export const ArchitectureQ2_1 = () => {
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

  useEffect(() => {
    setJobs([]);
    let i = 0;
    const interval = setInterval(() => {
      if (i < JOBS.length) {
        const newJob = { ...JOBS[i], done1: false, done2: false };
        setJobs((prev) => [...prev, newJob]);
        i++;
      } else clearInterval(interval);
    }, 700);
    return () => clearInterval(interval);
  }, [trigger]);

  const handleComplete = (jobId: number, worker: 1 | 2) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? worker === 1
            ? { ...j, done1: true }
            : { ...j, done2: true }
          : j
      )
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
          jobs.map((job, idx) => (
            <React.Fragment key={job.id}>
              {/* Job vers Worker 1 */}
              <motion.div
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
                onAnimationComplete={() => handleComplete(job.id, 1)}
                className={`absolute flex items-center justify-center rounded-full text-xs md:text-base h-6 w-6 md:w-12 md:h-12 font-bold text-white shadow-md ${
                  job.done1 ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {job.id}
              </motion.div>

              {/* Job vers Worker 2 */}
              <motion.div
                initial={{
                  top: 30,
                  left: containerWidth / 2 - jobSize / 2,
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  top: 180,
                  left:
                    containerWidth - margin - jobSize - idx * (jobSize + 10),
                  scale: 1,
                  opacity: 1,
                }}
                transition={{ duration: 1.2, type: "spring", stiffness: 60 }}
                onAnimationComplete={() => handleComplete(job.id, 2)}
                className={`absolute flex items-center justify-center rounded-full text-xs md:text-base h-6 w-6 md:w-12 md:h-12 font-bold text-white shadow-md ${
                  job.done2 ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {job.id}
              </motion.div>
            </React.Fragment>
          ))}

        <div className="absolute left-12 bottom-4 text-green-600 font-semibold">
          {jobs.every((j) => j.done1)
            ? "All Done 1"
            : jobs.some((j) => j.done1)
            ? "Done 1"
            : ""}
        </div>
        <div className="absolute right-12 bottom-4 text-green-600 font-semibold">
          {jobs.every((j) => j.done2)
            ? "All Done 2"
            : jobs.some((j) => j.done2)
            ? "Done 2"
            : ""}
        </div>

        {/* Refresh */}
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
