/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2,
  Brush,
  Eraser,
  RotateCcw,
  Circle,
  Square,
  Type,
  Trash2,
  Sparkles,
  Trophy,
  Smile,
} from "lucide-react";

export default function PlayView() {
  const { currentUser, userA, userB, awardXp } = useCouple();

  const [activePlaySubTab, setActivePlaySubTab] = useState<"games" | "canvas">("games");

  // --- COLLABORATIVE CANVAS STATE ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState("#ff4d6d");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<"brush" | "eraser" | "circle" | "square">("brush");
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // No partner cursor simulation

  // Canvas context cache
  useEffect(() => {
    if (activePlaySubTab === "canvas") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          // Seed initial white board
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          saveToHistory();
        }
      }
    }
  }, [activePlaySubTab]);

  // Partner drawing simulation loop removed

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), dataUrl]);
      setHistoryIndex((prev) => prev + 1);
    }
  };

  const handleDrawingStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      setIsDrawing(true);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const handleDrawingMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (tool === "brush" || tool === "eraser") {
          ctx.lineTo(x, y);
          ctx.stroke();
        } else if (tool === "circle") {
          // simple preview-less placement for stability
          ctx.arc(x, y, brushSize * 3, 0, Math.PI * 2);
          ctx.stroke();
          setIsDrawing(false); // only one shape
        } else if (tool === "square") {
          ctx.strokeRect(x - brushSize * 3, y - brushSize * 3, brushSize * 6, brushSize * 6);
          setIsDrawing(false);
        }
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && e.touches.length > 0) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      setIsDrawing(true);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas && e.touches.length > 0) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (tool === "brush" || tool === "eraser") {
          ctx.lineTo(x, y);
          ctx.stroke();
        } else if (tool === "circle") {
          ctx.arc(x, y, brushSize * 3, 0, Math.PI * 2);
          ctx.stroke();
          setIsDrawing(false);
        } else if (tool === "square") {
          ctx.strokeRect(x - brushSize * 3, y - brushSize * 3, brushSize * 6, brushSize * 6);
          setIsDrawing(false);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
      awardXp(5, "collaborative sketching");
    }
  };

  const handleDrawingEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
      awardXp(5, "collaborative sketching");
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const img = new Image();
      img.src = history[prevIdx];
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d");
        ctx?.clearRect(0, 0, 600, 400);
        ctx?.drawImage(img, 0, 0);
      };
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  };

  // --- GAMES HUB STATE ---
  const [activeGame, setActiveGame] = useState<"ttt" | "connect4" | "dare" | "quiz" | "wouldYouRather">("ttt");

  // TIC TAC TOE STATE
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<"O" | "X">("O"); // O = Partner A, X = Partner B
  const [tttWinner, setTttWinner] = useState<string | null>(null);
  const [scores, setScores] = useState({ userA: 2, userB: 3 });

  const checkTTTWinner = (b: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6],            // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, c, d] = lines[i];
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return b[a];
      }
    }
    if (b.every((cell) => cell !== null)) return "draw";
    return null;
  };

  const playTTTCell = (idx: number) => {
    if (board[idx] || tttWinner) return;

    // O = Partner A, X = Partner B
    const cellValue = tttTurn;
    const nextBoard = [...board];
    nextBoard[idx] = cellValue;
    setBoard(nextBoard);

    const winRes = checkTTTWinner(nextBoard);
    if (winRes) {
      setTttWinner(winRes);
      if (winRes === "O") {
        setScores((prev) => ({ ...prev, userA: prev.userA + 1 }));
        awardXp(40, `winning Tic Tac Toe as ${userA.name}`);
      } else if (winRes === "X") {
        setScores((prev) => ({ ...prev, userB: prev.userB + 1 }));
        awardXp(40, `winning Tic Tac Toe as ${userB.name}`);
      } else {
        awardXp(15, "completing a draw match");
      }
    } else {
      setTttTurn(tttTurn === "O" ? "X" : "O");
    }
  };

  const resetTTT = () => {
    setBoard(Array(9).fill(null));
    setTttWinner(null);
    setTttTurn("O");
  };

  // WOULD YOU RATHER STATE
  const [wyrIndex, setWyrIndex] = useState(0);
  const [wyrVote, setWyrVote] = useState<string | null>(null);

  const wyrQuestions = [
    { optA: "Live in a Ghibli-themed forest cottage 🌲", optB: "Live in a high-rise Tokyo penthouse 🗼", votesA: 82, votesB: 18 },
    { optA: "Receive one handwritten love letter every week ✉️", optB: "Receive a surprise cute date trip every month ✈️", votesA: 65, votesB: 35 },
    { optA: "Bake fresh lemon madeleines together at home 🍋", optB: "Go to a Michelin-star cafe together in Paris 🗼", votesA: 48, votesB: 52 },
  ];

  const voteWyr = (opt: "A" | "B") => {
    setWyrVote(opt);
    awardXp(15, "casting romantic ballot");
  };

  // SPIN THE WHEEL DARE STATE
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [dareResult, setDareResult] = useState<string | null>(null);

  const dareItems = [
    "Give partner a tight 10-second hug 🤗",
    "Whisper 3 cute reasons why you love them ❤️",
    "Prepare a hot cup of lemon tea or coffee ☕",
    "Sing 1 line of your favorite song together 🎵",
    "Archived! Send one cute polaroid photo 📸",
    "Massages! 5-minute shoulders massage 💆‍♂️",
  ];

  const triggerWheelSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setDareResult(null);

    const randomRotations = 1800 + Math.floor(Math.random() * 360);
    setSpinDeg((prev) => prev + randomRotations);

    setTimeout(() => {
      setIsSpinning(false);
      const index = Math.floor(Math.random() * dareItems.length);
      setDareResult(dareItems[index]);
      awardXp(25, `spinning the dare wheel to get: ${dareItems[index]}`);
    }, 3000);
  };

  return (
    <div className="space-y-6" id="playroom-container">
      {/* Play SubTab switcher */}
      <div className="flex justify-center">
        <div className="bg-black/5 p-1 rounded-full flex gap-1 inline-flex">
          <button
            onClick={() => setActivePlaySubTab("games")}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activePlaySubTab === "games" ? "bg-white text-[var(--text-main)] shadow" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🎮 Arcade Games
          </button>
          <button
            onClick={() => setActivePlaySubTab("canvas")}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
              activePlaySubTab === "canvas" ? "bg-white text-[var(--text-main)] shadow" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            🎨 Shared Sketch Canvas
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SUBTAB 1: ARCADE HUB */}
        {activePlaySubTab === "games" && (
          <motion.div
            key="games"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left selector */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-panel p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Gamepad2 className="w-4.5 h-4.5 text-rose-500" />
                  Couple Mini Arcade
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Take turns playing sweet, cooperative games inside our bubble.
                </p>

                <div className="space-y-2 pt-2">
                  {[
                    { id: "ttt", name: "Tic Tac Toe ⭕❌", desc: "Turn-by-turn logic board" },
                    { id: "wouldYouRather", name: "Would You Rather? 🤔", desc: "Romantic dilemmas" },
                    { id: "dare", name: "Spin The Dare Wheel 🎡", desc: "Sweet activities generator" },
                  ].map((game) => (
                    <button
                      key={game.id}
                      onClick={() => {
                        setActiveGame(game.id as any);
                        setWyrVote(null);
                        setDareResult(null);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        activeGame === game.id
                          ? "border-[var(--primary)] bg-[var(--primary)]/5 font-bold"
                          : "border-gray-200 bg-white/40 hover:bg-white"
                      }`}
                    >
                      <p className="text-xs font-bold text-[var(--text-main)]">{game.name}</p>
                      <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{game.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Active Game Playbox */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center min-h-[360px] text-center relative overflow-hidden">
                
                {/* GAME A: TIC TAC TOE */}
                {activeGame === "ttt" && (
                  <div className="space-y-4 w-full max-w-sm">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <div className="text-left">
                        <span className="text-[10px] text-[var(--text-muted)] block font-mono">Score Board</span>
                        <span className="text-xs font-bold">{userA.name.split(" ")[0]} {scores.userA} - {scores.userB} {userB.name.split(" ")[0]}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[var(--text-muted)] block">Turn Indicator</span>
                        <span className="text-xs font-bold bg-[var(--primary)]/10 px-2 py-0.5 rounded border border-[var(--primary)]/20 text-[var(--primary)]">
                          {tttTurn === "O" ? `${userA.name} (O)` : `${userB.name} (X)`}
                        </span>
                      </div>
                    </div>

                    {/* The 3x3 Board Grid */}
                    <div className="grid grid-cols-3 gap-2 mx-auto w-56 h-56 mt-4">
                      {board.map((cell, idx) => (
                        <button
                          key={idx}
                          onClick={() => playTTTCell(idx)}
                          className="bg-white/90 hover:bg-white border rounded-xl flex items-center justify-center text-2xl font-black transition-all shadow-sm active:scale-95"
                        >
                          {cell === "O" && <span className="text-rose-500 font-serif">O</span>}
                          {cell === "X" && <span className="text-blue-500 font-mono">X</span>}
                        </button>
                      ))}
                    </div>

                    {/* Win overlay announcement */}
                    {tttWinner && (
                      <div className="pt-4 space-y-2">
                        <p className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1">
                          <Trophy className="w-4 h-4 fill-current text-yellow-500" />
                          {tttWinner === "draw"
                            ? "Draw Match! Well played."
                            : `${tttWinner === "O" ? userA.name : userB.name} won the match!`}
                        </p>
                        <button
                          onClick={resetTTT}
                          className="px-4 py-1.5 bg-black text-white text-xs rounded-full font-bold"
                        >
                          Rematch Round
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* GAME B: WOULD YOU RATHER */}
                {activeGame === "wouldYouRather" && (
                  <div className="space-y-6 w-full max-w-md">
                    <div className="space-y-2">
                      <span className="text-[10px] tracking-wider uppercase text-rose-500 font-bold">
                        Question {wyrIndex + 1} of {wyrQuestions.length}
                      </span>
                      <h4 className="text-base font-bold font-serif text-[var(--text-main)]">
                        Would you rather...
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-2">
                      {/* Option A */}
                      <button
                        onClick={() => voteWyr("A")}
                        disabled={wyrVote !== null}
                        className={`p-4 rounded-xl text-xs font-semibold text-left border transition-all ${
                          wyrVote === "A"
                            ? "bg-[var(--primary)] text-white border-[var(--primary)] scale-105 shadow-md"
                            : "bg-white/80 border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--primary)]/50 hover:bg-white"
                        }`}
                      >
                        <p>{wyrQuestions[wyrIndex].optA}</p>
                        {wyrVote && (
                          <p className="text-[10px] opacity-80 mt-1 font-mono">
                            {wyrQuestions[wyrIndex].votesA}% of sweet couples chose this
                          </p>
                        )}
                      </button>

                      {/* Option B */}
                      <button
                        onClick={() => voteWyr("B")}
                        disabled={wyrVote !== null}
                        className={`p-4 rounded-xl text-xs font-semibold text-left border transition-all ${
                          wyrVote === "B"
                            ? "bg-[var(--primary)] text-white border-[var(--primary)] scale-105 shadow-md"
                            : "bg-white/80 border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--primary)]/50 hover:bg-white"
                        }`}
                      >
                        <p>{wyrQuestions[wyrIndex].optB}</p>
                        {wyrVote && (
                          <p className="text-[10px] opacity-80 mt-1 font-mono">
                            {wyrQuestions[wyrIndex].votesB}% of sweet couples chose this
                          </p>
                        )}
                      </button>
                    </div>

                    {wyrVote && (
                      <button
                        onClick={() => {
                          setWyrIndex((wyrIndex + 1) % wyrQuestions.length);
                          setWyrVote(null);
                        }}
                        className="text-xs bg-black text-white px-4 py-1.5 rounded-full font-bold"
                      >
                        Next Dilemma
                      </button>
                    )}
                  </div>
                )}

                {/* GAME C: SPIN THE WHEEL DARE */}
                {activeGame === "dare" && (
                  <div className="space-y-6 flex flex-col items-center">
                    <span className="text-[10px] text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Truth or Dare wheel
                    </span>

                    {/* Rotating Wheel graphic wrapper */}
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <div
                        className="w-full h-full rounded-full border-4 border-slate-800 relative transition-transform duration-3000 ease-out flex items-center justify-center"
                        style={{
                          transform: `rotate(${spinDeg}deg)`,
                          backgroundImage: "conic-gradient(#ff85a1 0% 16%, #ffb7b2 16% 33%, #ccd5ae 33% 50%, #eef1f6 50% 66%, #ffccd5 66% 83%, #fcf6bd 83% 100%)",
                        }}
                      >
                        {/* Hub marker */}
                        <div className="w-6 h-6 bg-slate-800 rounded-full border border-white z-10" />
                        <div className="absolute top-2 w-1.5 h-10 bg-slate-800 rounded-full" />
                      </div>
                      {/* Needle Indicator */}
                      <div className="absolute -top-3 w-4 h-6 bg-red-600 rounded-b-full shadow z-20" />
                    </div>

                    <button
                      onClick={triggerWheelSpin}
                      disabled={isSpinning}
                      className="px-6 py-2 bg-[var(--primary)] text-white font-bold rounded-full text-xs shadow-md hover:opacity-90 active:scale-95 transition-all"
                    >
                      {isSpinning ? "Spinning Wheel..." : "Spin Couple Wheel"}
                    </button>

                    <AnimatePresence>
                      {dareResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl max-w-xs"
                        >
                          <p className="text-[10px] text-[var(--primary)] uppercase font-bold">Dare Decided!</p>
                          <p className="text-xs text-[var(--text-main)] font-bold mt-1 font-serif">
                            "{dareResult}"
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: SKETCH CANVAS */}
        {activePlaySubTab === "canvas" && (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Controls Box */}
            <div className="lg:col-span-3 space-y-4">
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  Sketch Studio
                </h3>

                {/* Brush / Eraser */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-400 block">Tools</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setTool("brush")}
                      className={`text-xs py-1.5 border rounded-lg flex items-center justify-center gap-1 ${
                        tool === "brush" ? "border-black font-bold bg-black/5" : "border-gray-200"
                      }`}
                    >
                      <Brush className="w-3.5 h-3.5" /> Draw
                    </button>
                    <button
                      onClick={() => setTool("eraser")}
                      className={`text-xs py-1.5 border rounded-lg flex items-center justify-center gap-1 ${
                        tool === "eraser" ? "border-black font-bold bg-black/5" : "border-gray-200"
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" /> Erase
                    </button>
                  </div>
                </div>

                {/* Shape selectors */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-400 block">Stamp Shapes</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setTool("circle")}
                      className={`text-xs py-1.5 border rounded-lg flex items-center justify-center gap-1 ${
                        tool === "circle" ? "border-black font-bold bg-black/5" : "border-gray-200"
                      }`}
                    >
                      <Circle className="w-3.5 h-3.5" /> Circle
                    </button>
                    <button
                      onClick={() => setTool("square")}
                      className={`text-xs py-1.5 border rounded-lg flex items-center justify-center gap-1 ${
                        tool === "square" ? "border-black font-bold bg-black/5" : "border-gray-200"
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" /> Square
                    </button>
                  </div>
                </div>

                {/* Color choices */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-gray-400 block">Palette</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {["#ff4d6d", "#10b981", "#6366f1", "#fbbf24", "#000000"].map((pal) => (
                      <button
                        key={pal}
                        onClick={() => {
                          setColor(pal);
                          if (tool === "eraser") setTool("brush");
                        }}
                        style={{ backgroundColor: pal }}
                        className={`h-6 rounded-full border-2 transition-transform ${
                          color === pal && tool !== "eraser" ? "border-white scale-110 shadow" : "border-transparent"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Brush size */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-gray-400 block">
                    Weight: {brushSize}px
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Undo / Clear operations */}
                <div className="grid grid-cols-2 gap-1.5 pt-3 border-t">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="text-xs py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 rounded-lg flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button
                    onClick={handleClear}
                    className="text-xs py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Right Interactive Drawing Canvas */}
            <div className="lg:col-span-9 flex flex-col items-center">
              <div className="relative border border-[var(--border-color)] bg-white rounded-3xl shadow-lg overflow-hidden w-full max-w-2xl cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  onMouseDown={handleDrawingStart}
                  onMouseMove={handleDrawingMove}
                  onMouseUp={handleDrawingEnd}
                  onMouseLeave={handleDrawingEnd}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="w-full h-[280px] min-[400px]:h-[320px] sm:h-[400px] touch-none"
                />

                {/* Real-time Synced Partner Cursor Mockup Removed */}
              </div>

              <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] rounded-xl flex items-center gap-2 border border-[var(--primary)]/20 mt-3 w-full">
                <span>💡</span>
                <span>Draw your feelings and express yourself on the shared canvas space! Switch your user profile to add more stamps.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
