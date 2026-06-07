import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface DiceProps {
  value: number;
  rolling: boolean;
}

export function Dice({ value, rolling }: DiceProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!rolling) {
      setDisplayValue(value);
      return;
    }
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [rolling, value]);

  const dots = Array.from({ length: displayValue }, (_, i) => i);

  const getDotPattern = (val: number) => {
    switch (val) {
      case 1: return "justify-center items-center";
      case 2: return "justify-between";
      case 3: return "justify-between";
      case 4: return "grid grid-cols-2 grid-rows-2 gap-2";
      case 5: return "grid grid-cols-2 grid-rows-2 gap-2";
      case 6: return "grid grid-cols-2 grid-rows-3 gap-1";
      default: return "";
    }
  };

  const renderDots = (val: number) => {
    if (val === 1) return <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />;
    if (val === 2) return (
      <div className="flex flex-col justify-between h-full w-full p-2">
        <div className="w-3 h-3 rounded-full bg-black self-end" />
        <div className="w-3 h-3 rounded-full bg-black self-start" />
      </div>
    );
    if (val === 3) return (
      <div className="flex flex-col justify-between h-full w-full p-2">
        <div className="w-3 h-3 rounded-full bg-black self-end" />
        <div className="w-3 h-3 rounded-full bg-black self-center" />
        <div className="w-3 h-3 rounded-full bg-black self-start" />
      </div>
    );
    if (val === 4) return (
      <div className="grid grid-cols-2 grid-rows-2 gap-2 p-2 w-full h-full place-items-center">
        {dots.map(i => <div key={i} className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />)}
      </div>
    );
    if (val === 5) return (
      <div className="relative p-2 w-full h-full">
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-black" />
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-black" />
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-black" />
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-black" />
      </div>
    );
    if (val === 6) return (
      <div className="grid grid-cols-2 grid-rows-3 gap-y-1 gap-x-2 p-2 w-full h-full place-items-center">
        {dots.map(i => <div key={i} className="w-3 h-3 rounded-full bg-black" />)}
      </div>
    );
    return null;
  };

  return (
    <motion.div
      animate={
        rolling
          ? {
              rotateX: [0, 360, 720, 1080],
              rotateY: [0, 180, 360, 720],
              rotateZ: [0, 90, 180, 360],
              scale: [1, 1.2, 0.8, 1],
              filter: ["drop-shadow(0 0 10px rgba(255,215,0,0.2))", "drop-shadow(0 0 30px rgba(255,215,0,0.8))", "drop-shadow(0 0 10px rgba(255,215,0,0.2))"]
            }
          : {
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 1,
              filter: "drop-shadow(0 0 15px rgba(255,215,0,0.4))"
            }
      }
      transition={{
        duration: rolling ? 0.6 : 0.4,
        ease: rolling ? "linear" : "easeOut",
        repeat: rolling ? Infinity : 0
      }}
      className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2),_0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden transform-gpu"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-200 opacity-90 rounded-xl" />
      <div className={`relative z-10 w-full h-full flex ${getDotPattern(displayValue)}`}>
        {renderDots(displayValue)}
      </div>
    </motion.div>
  );
}
