"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

type Point = { x: number; y: number };

export default function ArchitectureQ3StepFinalB({ count }: { count: number }) {
  const [phase, setPhase] = useState<"forward" | "waitingReply" | "reply">(
    "forward"
  );
  const [p, setP] = useState(0); // 0 → 1 progression du signal
  const [timer, setTimer] = useState(count);
  const replyDelayRef = useRef(0);
  const [replyDelayDisplay, setReplyDelayDisplay] = useState(1);
  const [replyDelayTotal, setReplyDelayTotal] = useState(1);
  const [failed, setFailed] = useState(false);
  const [trigger, setTrigger] = useState(0); // pour restart

  const bezier = (
    p: number,
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point
  ): Point => {
    const u = 1 - p;
    return {
      x:
        u * u * u * p0.x +
        3 * u * u * p * p1.x +
        3 * u * p * p * p2.x +
        p * p * p * p3.x,
      y:
        u * u * u * p0.y +
        3 * u * u * p * p1.y +
        3 * u * p * p * p2.y +
        p * p * p * p3.y,
    };
  };

  const A1 = { x: 148, y: 92 };
  const B1 = { x: 340, y: 10 };
  const C1 = { x: 560, y: 10 };
  const D1 = { x: 752, y: 92 };
  const A2 = { x: 148, y: 110 };
  const D2 = { x: 752, y: 110 };
  const A3 = { x: 148, y: 128 };
  const B3 = { x: 340, y: 210 };
  const C3 = { x: 560, y: 210 };
  const D3 = { x: 752, y: 128 };

  useEffect(() => {
    if (failed) return;

    const id = setInterval(() => {
      setTimer((t) => {
        const newTimer = Math.max(0, t - 0.03);
        if (newTimer === 0) setFailed(true);
        return newTimer;
      });
      setReplyDelayDisplay(replyDelayRef.current);

      if (phase === "forward") {
        setP((v) => {
          const nv = v + 0.05;
          if (nv >= 1) {
            setPhase("waitingReply");
            return 1;
          }
          return nv;
        });
      }

      if (phase === "waitingReply" && !failed) {
        replyDelayRef.current -= 0.03;
        if (replyDelayRef.current <= 0) {
          setPhase("reply");
          setP(0);
        }
      }

      if (phase === "reply" && !failed) {
        setP((v) => {
          const nv = v + 0.05;
          if (nv >= 1) {
            replyDelayRef.current = replyDelayTotal + 1;
            setReplyDelayTotal(replyDelayRef.current);
            setTimer(count);
            setPhase("forward");
            return 0;
          }
          return nv;
        });
      }
    }, 30);

    return () => clearInterval(id);
  }, [phase, failed, trigger, count]);

  const progForward = p;
  const progReply = 1 - p;
  const dotTop = bezier(progForward, A1, B1, C1, D1);
  const dotMid = { x: A2.x + (D2.x - A2.x) * progForward, y: A2.y };
  const dotBot = bezier(progReply, A3, B3, C3, D3);
  const waitingDot = { x: D3.x, y: D3.y };

  return (
    <div className="relative w-full flex justify-center items-center py-8">
      <svg viewBox="0 0 900 220" className="w-full max-w-4xl">
        {/* MAIN */}
        <circle cx="120" cy="110" r="28" fill="#0f172a" />
        <text x="120" y="115" textAnchor="middle" fill="#fff" fontSize="12">
          MAIN
        </text>

        {/* NODE1 */}
        <circle cx="780" cy="110" r="28" fill="#0f172a" />
        <text x="780" y="115" textAnchor="middle" fill="#fff" fontSize="12">
          NODE1
        </text>
        <text x="780" y="135" textAnchor="middle" fill="#f472b6" fontSize="14">
          {replyDelayDisplay < 0 ? 0 : replyDelayDisplay.toFixed(1)}
        </text>

        {/* Paths */}
        <path
          d="M148 92 C 340 10, 560 10, 752 92"
          stroke="#60a5fa"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <line
          x1="148"
          y1="110"
          x2="752"
          y2="110"
          stroke="#34d399"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M148 128 C 340 210, 560 210, 752 128"
          stroke="#f472b6"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />

        {/* Animated signals with text */}
        {phase === "forward" && (
          <>
            <circle cx={dotTop.x} cy={dotTop.y} r="7" fill="#60a5fa" />
            <text
              x={450}
              y={20}
              textAnchor="middle"
              fill="#60a5fa"
              fontSize="14"
            >
              Job {replyDelayTotal.toFixed(1)}
            </text>
            <circle cx={dotMid.x} cy={dotMid.y} r="7" fill="#34d399" />
            <text
              x={450}
              y={90}
              textAnchor="middle"
              fill="#34d399"
              fontSize="14"
            >
              HB {replyDelayTotal.toFixed(0)}
            </text>
          </>
        )}
        {phase === "waitingReply" && (
          <circle cx={waitingDot.x} cy={waitingDot.y} r="7" fill="#f472b6" />
        )}
        {phase === "reply" && (
          <>
            <circle cx={dotBot.x} cy={dotBot.y} r="7" fill="#f472b6" />
            <text
              x={450}
              y={160}
              textAnchor="middle"
              fill="#f472b6"
              fontSize="14"
            >
              HB Reply {replyDelayTotal.toFixed(0)}
            </text>
          </>
        )}

        {/* Timer circle bottom-left */}
        <circle cx="50" cy="180" r="30" fill="#0f172a" />
        <text
          x="50"
          y="180"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#60a5fa"
          fontSize="18"
        >
          {timer.toFixed(1)}
        </text>

        {/* Failure message */}
        {failed && (
          <text x="450" y="110" textAnchor="middle" fill="red" fontSize="24">
            FAILURE DETECTED
          </text>
        )}
      </svg>

      {/* Restart button */}
      <div className="absolute right-0 bottom-0 -translate-x-1/2">
        <button
          className="p-2 md:px-4 md:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => {
            setFailed(false);
            setPhase("forward");
            setP(0);
            setTimer(count);
            replyDelayRef.current = 0;
            setReplyDelayDisplay(1);
            setReplyDelayTotal(1);
            setTrigger((prev) => prev + 1);
          }}
        >
          <ArrowPathIcon className="inline-block w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
