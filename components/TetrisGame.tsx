"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

interface TetrisPiece {
  shape: number[][];
  color: string;
}

interface ScoreEntry {
  score: number;
  date: string;
  timestamp: number;
  playerName: string;
  lines: number;
  level: number;
}

type GameState = "PLAYING" | "PAUSED" | "GAME_OVER";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 1000; // milliseconds

const STORAGE_KEY = "tetris-game-scores";

// Tetris pieces (Tetrominoes)
const TETROMINOES: TetrisPiece[] = [
  // I piece
  {
    shape: [[1, 1, 1, 1]],
    color: "bg-cyan-400",
  },
  // O piece
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "bg-yellow-400",
  },
  // T piece
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "bg-purple-400",
  },
  // S piece
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "bg-green-400",
  },
  // Z piece
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "bg-red-400",
  },
  // J piece
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "bg-blue-400",
  },
  // L piece
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "bg-orange-400",
  },
];

export default function TetrisGame() {
  const [board, setBoard] = useState<string[][]>(
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(""))
  );
  const [currentPiece, setCurrentPiece] = useState<TetrisPiece | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [nextPiece, setNextPiece] = useState<TetrisPiece | null>(null);
  const [gameState, setGameState] = useState<GameState>("PLAYING");
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load high scores from localStorage
  const loadHighScores = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const scores = JSON.parse(stored) as ScoreEntry[];
        setHighScores(scores);
        if (scores.length > 0) {
          setCurrentHighScore(Math.max(...scores.map((s) => s.score)));
        }
      }
    } catch (error) {
      console.error("Failed to load high scores:", error);
    }
  }, []);

  // Save high scores to localStorage
  const saveHighScore = useCallback(
    (newScore: number, name: string) => {
      try {
        const newEntry: ScoreEntry = {
          score: newScore,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          playerName: name,
          lines: lines,
          level: level,
        };

        const updatedScores = [...highScores, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Keep only top 10 scores

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScores));
        setHighScores(updatedScores);
        setCurrentHighScore(Math.max(...updatedScores.map((s) => s.score)));
      } catch (error) {
        console.error("Failed to save high score:", error);
      }
    },
    [highScores, lines, level]
  );

  // Handle game over
  const handleGameOver = useCallback(() => {
    setGameState("GAME_OVER");
    if (score > 0) {
      setShowNameInput(true);
      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [score]);

  // Submit player name
  const submitName = useCallback(() => {
    const trimmedName = playerName.trim();
    if (trimmedName) {
      saveHighScore(score, trimmedName);
      setShowNameInput(false);
      setPlayerName("");
    }
  }, [playerName, score, saveHighScore]);

  // Handle name input key press
  const handleNameKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        submitName();
      } else if (event.key === "Escape") {
        setShowNameInput(false);
        setPlayerName("");
      }
    },
    [submitName]
  );

  // Load high scores on component mount
  useEffect(() => {
    loadHighScores();
  }, [loadHighScores]);

  // Generate random piece
  const getRandomPiece = useCallback((): TetrisPiece => {
    return TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  }, []);

  // Initialize new piece
  const spawnPiece = useCallback(() => {
    const newPiece = nextPiece || getRandomPiece();
    const newNextPiece = getRandomPiece();

    setCurrentPiece(newPiece);
    setNextPiece(newNextPiece);
    setCurrentPosition({
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newPiece.shape[0].length / 2),
      y: 0,
    });

    // Check if game over
    if (
      isCollision(newPiece, {
        x:
          Math.floor(BOARD_WIDTH / 2) -
          Math.floor(newPiece.shape[0].length / 2),
        y: 0,
      })
    ) {
      handleGameOver();
    }
  }, [nextPiece, getRandomPiece, handleGameOver]);

  // Check collision
  const isCollision = useCallback(
    (piece: TetrisPiece, position: Position): boolean => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = position.x + x;
            const newY = position.y + y;

            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
              return true;
            }

            if (newY >= 0 && board[newY][newX]) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [board]
  );

  // Rotate piece
  const rotatePiece = useCallback((piece: TetrisPiece): TetrisPiece => {
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map((row) => row[i]).reverse()
    );
    return { ...piece, shape: rotated };
  }, []);

  // Move piece
  const movePiece = useCallback(
    (dx: number, dy: number) => {
      if (!currentPiece || gameState !== "PLAYING") return;

      const newPosition = {
        x: currentPosition.x + dx,
        y: currentPosition.y + dy,
      };

      if (!isCollision(currentPiece, newPosition)) {
        setCurrentPosition(newPosition);
      } else if (dy > 0) {
        // Piece landed, place it on board
        placePiece();
      }
    },
    [currentPiece, currentPosition, gameState, isCollision]
  );

  // Place piece on board
  const placePiece = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = board.map((row) => [...row]);

    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPosition.y + y;
          const boardX = currentPosition.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      }
    }

    setBoard(newBoard);
    clearLines(newBoard);
    spawnPiece();
  }, [currentPiece, currentPosition, board, spawnPiece]);

  // Clear completed lines
  const clearLines = useCallback(
    (currentBoard: string[][]) => {
      let linesCleared = 0;
      const newBoard = currentBoard.filter((row) => {
        const isComplete = row.every((cell) => cell !== "");
        if (isComplete) {
          linesCleared++;
          return false;
        }
        return true;
      });

      // Add empty rows at top
      while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(""));
      }

      setBoard(newBoard);

      if (linesCleared > 0) {
        const newLines = lines + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        const points = [0, 100, 300, 500, 800][linesCleared] * level;

        setLines(newLines);
        setLevel(newLevel);
        setScore((prev) => prev + points);
      }
    },
    [lines, level]
  );

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (gameState === "GAME_OVER") return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          movePiece(-1, 0);
          break;
        case "ArrowRight":
          event.preventDefault();
          movePiece(1, 0);
          break;
        case "ArrowDown":
          event.preventDefault();
          movePiece(0, 1);
          break;
        case "ArrowUp":
        case " ":
          event.preventDefault();
          if (currentPiece) {
            const rotated = rotatePiece(currentPiece);
            if (!isCollision(rotated, currentPosition)) {
              setCurrentPiece(rotated);
            }
          }
          break;
        case "p":
        case "P":
          event.preventDefault();
          setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : "PLAYING"));
          break;
      }
    },
    [
      gameState,
      movePiece,
      currentPiece,
      currentPosition,
      rotatePiece,
      isCollision,
    ]
  );

  // Game loop
  const gameLoop = useCallback(
    (time: number) => {
      if (gameState !== "PLAYING") return;

      if (time - lastTimeRef.current > INITIAL_SPEED / level) {
        movePiece(0, 1);
        lastTimeRef.current = time;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    },
    [gameState, level, movePiece]
  );

  // Initialize game
  useEffect(() => {
    spawnPiece();
  }, [spawnPiece]);

  // Game loop effect
  useEffect(() => {
    if (gameState === "PLAYING") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(""))
    );
    setCurrentPiece(null);
    setCurrentPosition({ x: 0, y: 0 });
    setNextPiece(null);
    setGameState("PLAYING");
    setScore(0);
    setLines(0);
    setLevel(1);
    setShowNameInput(false);
    setPlayerName("");
    lastTimeRef.current = 0;
  }, []);

  const clearHighScores = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHighScores([]);
    setCurrentHighScore(0);
  };

  // Render board cell
  const renderCell = (y: number, x: number) => {
    let cellColor = board[y][x];

    // Draw current piece
    if (currentPiece && currentPosition) {
      const pieceY = y - currentPosition.y;
      const pieceX = x - currentPosition.x;

      if (
        pieceY >= 0 &&
        pieceY < currentPiece.shape.length &&
        pieceX >= 0 &&
        pieceX < currentPiece.shape[0].length &&
        currentPiece.shape[pieceY][pieceX]
      ) {
        cellColor = currentPiece.color;
      }
    }

    return (
      <div
        key={`${y}-${x}`}
        className={`w-6 h-6 border border-gray-600 ${
          cellColor || "bg-gray-800"
        }`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">Tetris</h1>
          <div className="text-white mb-4">
            <div className="flex justify-between items-center mb-2">
              <p>
                Score:{" "}
                <span className="text-yellow-400 font-bold">{score}</span>
              </p>
              <p>
                High Score:{" "}
                <span className="text-green-400 font-bold">
                  {currentHighScore}
                </span>
              </p>
            </div>
            <div className="flex justify-between items-center mb-2">
              <p>
                Level: <span className="text-green-400 font-bold">{level}</span>
              </p>
              <p>
                Lines: <span className="text-blue-400 font-bold">{lines}</span>
              </p>
            </div>
            {gameState === "GAME_OVER" && (
              <p className="text-red-400 font-bold text-xl mt-2">Game Over!</p>
            )}
            {gameState === "PAUSED" && (
              <p className="text-blue-400 font-bold text-xl mt-2">Paused</p>
            )}
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Game Board */}
          <div className="border-2 border-gray-600 bg-gray-700 p-2">
            <div
              className="grid gap-0"
              style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)` }}
            >
              {board.map((row, y) => row.map((_, x) => renderCell(y, x)))}
            </div>
          </div>

          {/* Side Panel */}
          <div className="text-white">
            {/* Next Piece */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Next:</h3>
              <div className="border-2 border-gray-600 bg-gray-700 p-2">
                {nextPiece && (
                  <div
                    className="grid gap-0"
                    style={{
                      gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 1fr)`,
                    }}
                  >
                    {nextPiece.shape.map((row, y) =>
                      row.map((cell, x) => (
                        <div
                          key={`next-${y}-${x}`}
                          className={`w-4 h-4 border border-gray-600 ${
                            cell ? nextPiece.color : "bg-gray-800"
                          }`}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Controls:</h3>
              <div className="text-sm space-y-1">
                <p>← → Move</p>
                <p>↓ Drop</p>
                <p>↑ / Space Rotate</p>
                <p>P Pause</p>
              </div>
            </div>

            {/* Game Over Button */}
            {gameState === "GAME_OVER" && !showNameInput && (
              <button
                onClick={resetGame}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Play Again
              </button>
            )}

            {/* Scoreboard Button */}
            <div className="mt-4">
              <button
                onClick={() => setShowScoreboard(!showScoreboard)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {showScoreboard ? "Hide" : "Show"} Scoreboard
              </button>
            </div>
          </div>
        </div>

        {/* Name Input Modal */}
        {showNameInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">
                  New High Score!
                </h2>
                <p className="text-white mb-4">
                  Score:{" "}
                  <span className="text-yellow-400 font-bold">{score}</span>
                </p>
                <p className="text-gray-300 mb-4">
                  Enter your name to save your score:
                </p>

                <input
                  ref={nameInputRef}
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={handleNameKeyPress}
                  placeholder="Your name"
                  maxLength={20}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 mb-4"
                />

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={submitName}
                    disabled={!playerName.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Save Score
                  </button>
                  <button
                    onClick={() => {
                      setShowNameInput(false);
                      setPlayerName("");
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Press Enter to save, Escape to cancel
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scoreboard Modal */}
        {showScoreboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-400">
                  High Scores
                </h2>
                <button
                  onClick={() => setShowScoreboard(false)}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              {highScores.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No high scores yet. Start playing!
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {highScores.map((entry, index) => (
                    <div
                      key={entry.timestamp}
                      className="flex justify-between items-center bg-gray-700 p-3 rounded"
                    >
                      <div className="flex items-center">
                        <span className="text-yellow-400 font-bold mr-3">
                          #{index + 1}
                        </span>
                        <span className="text-white font-medium">
                          {entry.playerName}
                        </span>
                        <span className="text-white ml-2">- {entry.score}</span>
                        <span className="text-gray-400 text-xs ml-2">
                          (L{entry.level})
                        </span>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {entry.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {highScores.length > 0 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={clearHighScores}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Clear All Scores
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
