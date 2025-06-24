"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type GameMode = "CLASSIC" | "WALL_PASS";

interface ScoreEntry {
  score: number;
  date: string;
  timestamp: number;
  mode: GameMode;
  playerName: string;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = "UP";
const GAME_SPEED = 100; // Faster for smoother gameplay

const STORAGE_KEY = "snake-game-scores";

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameMode, setGameMode] = useState<GameMode>("CLASSIC");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastDirectionRef = useRef<Direction>(INITIAL_DIRECTION);
  const nextDirectionRef = useRef<Direction>(INITIAL_DIRECTION);
  const inputBufferRef = useRef<Direction[]>([]);
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
          mode: gameMode,
          playerName: name,
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
    [highScores, gameMode]
  );

  // Handle game over
  const handleGameOver = useCallback(() => {
    setGameOver(true);
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

  // Generate food that doesn't collide with current snake
  const generateFoodForSnake = useCallback(
    (currentSnake: Position[]): Position => {
      let newFood: Position;
      do {
        newFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } while (
        currentSnake.some(
          (segment) => segment.x === newFood.x && segment.y === newFood.y
        )
      );
      return newFood;
    },
    []
  );

  // Check if position is valid (within bounds and not colliding with snake)
  const isValidPosition = useCallback((pos: Position): boolean => {
    return pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE;
  }, []);

  // Wrap position for wall-pass mode
  const wrapPosition = useCallback((pos: Position): Position => {
    return {
      x: (pos.x + GRID_SIZE) % GRID_SIZE,
      y: (pos.y + GRID_SIZE) % GRID_SIZE,
    };
  }, []);

  // Check if snake collides with itself
  const checkCollision = useCallback(
    (head: Position, body: Position[]): boolean => {
      return body.some(
        (segment) => segment.x === head.x && segment.y === head.y
      );
    },
    []
  );

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameOver || paused) return;

    setSnake((currentSnake) => {
      const newSnake = [...currentSnake];
      let head = { ...newSnake[0] };

      // Process input buffer
      if (inputBufferRef.current.length > 0) {
        const nextDirection = inputBufferRef.current.shift()!;
        if (nextDirection) {
          // Check if the direction change is valid (not opposite)
          const isValidDirectionChange =
            (lastDirectionRef.current === "UP" && nextDirection !== "DOWN") ||
            (lastDirectionRef.current === "DOWN" && nextDirection !== "UP") ||
            (lastDirectionRef.current === "LEFT" &&
              nextDirection !== "RIGHT") ||
            (lastDirectionRef.current === "RIGHT" && nextDirection !== "LEFT");

          if (isValidDirectionChange) {
            lastDirectionRef.current = nextDirection;
            setDirection(nextDirection);
          }
        }
      }

      const currentDirection = lastDirectionRef.current;

      // Move head based on direction
      switch (currentDirection) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      // Handle wall collision based on game mode
      if (gameMode === "CLASSIC") {
        if (!isValidPosition(head)) {
          handleGameOver();
          return currentSnake;
        }
      } else if (gameMode === "WALL_PASS") {
        head = wrapPosition(head);
      }

      // Check for self collision
      if (checkCollision(head, newSnake)) {
        handleGameOver();
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore((prev) => prev + 10);
        // Generate new food immediately
        const newFood = generateFoodForSnake(newSnake);
        setFood(newFood);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [
    gameOver,
    paused,
    food,
    isValidPosition,
    wrapPosition,
    checkCollision,
    generateFoodForSnake,
    gameMode,
    handleGameOver,
  ]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!gameStarted) {
        setGameStarted(true);
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        setPaused((prev) => !prev);
        return;
      }

      if (paused) return;

      let newDirection: Direction | null = null;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          newDirection = "UP";
          break;
        case "ArrowDown":
          event.preventDefault();
          newDirection = "DOWN";
          break;
        case "ArrowLeft":
          event.preventDefault();
          newDirection = "LEFT";
          break;
        case "ArrowRight":
          event.preventDefault();
          newDirection = "RIGHT";
          break;
      }

      if (newDirection && newDirection !== lastDirectionRef.current) {
        // Check if the direction change is valid (not opposite)
        const isValidDirectionChange =
          (lastDirectionRef.current === "UP" && newDirection !== "DOWN") ||
          (lastDirectionRef.current === "DOWN" && newDirection !== "UP") ||
          (lastDirectionRef.current === "LEFT" && newDirection !== "RIGHT") ||
          (lastDirectionRef.current === "RIGHT" && newDirection !== "LEFT");

        if (isValidDirectionChange) {
          // Add to input buffer (max 2 inputs)
          if (inputBufferRef.current.length < 2) {
            inputBufferRef.current.push(newDirection);
          }
        }
      }
    },
    [gameStarted, paused]
  );

  // Reset game
  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFoodForSnake(INITIAL_SNAKE));
    setDirection(INITIAL_DIRECTION);
    lastDirectionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    inputBufferRef.current = [];
    setGameOver(false);
    setScore(0);
    setGameStarted(false);
    setPaused(false);
    setShowNameInput(false);
    setPlayerName("");
  }, [generateFoodForSnake]);

  // Change game mode
  const changeGameMode = useCallback(
    (mode: GameMode) => {
      if (gameStarted && !gameOver) return; // Don't change mode during active game

      setGameMode(mode);
      resetGame();
    },
    [gameStarted, gameOver, resetGame]
  );

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver && !paused) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, paused, moveSnake]);

  // Keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Generate initial food
  useEffect(() => {
    setFood(generateFoodForSnake(INITIAL_SNAKE));
  }, [generateFoodForSnake]);

  const getDirectionArrow = (dir: Direction) => {
    switch (dir) {
      case "UP":
        return "↑";
      case "DOWN":
        return "↓";
      case "LEFT":
        return "←";
      case "RIGHT":
        return "→";
    }
  };

  const clearHighScores = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHighScores([]);
    setCurrentHighScore(0);
  };

  const getModeDisplayName = (mode: GameMode) => {
    switch (mode) {
      case "CLASSIC":
        return "Classic";
      case "WALL_PASS":
        return "Wall Pass";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 shadow-2xl w-[500px]">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-green-400 mb-2">Snake Game</h1>

          {/* Game Mode Selection */}
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">Game Mode:</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => changeGameMode("CLASSIC")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  gameMode === "CLASSIC"
                    ? "bg-green-500 text-white"
                    : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => changeGameMode("WALL_PASS")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  gameMode === "WALL_PASS"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              >
                Wall Pass
              </button>
            </div>
          </div>

          <div className="text-white mb-4 h-8">
            <div className="flex justify-between items-center">
              <p className="text-lg">
                Score:{" "}
                <span className="text-yellow-400 font-bold">{score}</span>
              </p>
              <p className="text-sm">
                High Score:{" "}
                <span className="text-green-400 font-bold">
                  {currentHighScore}
                </span>
              </p>
            </div>
            {gameOver && (
              <p className="text-red-400 font-bold text-xl mt-2">Game Over!</p>
            )}
            {paused && (
              <p className="text-blue-400 font-bold text-xl mt-2">Paused</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* Game Grid */}
          <div
            className="grid gap-0 border-2 border-gray-600 bg-gray-700"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: "400px",
              height: "400px",
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);
              const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
              const isSnakeBody = snake
                .slice(1)
                .some((segment) => segment.x === x && segment.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div
                  key={index}
                  className={`w-5 h-5 ${
                    isSnakeHead
                      ? "bg-green-400 rounded-sm"
                      : isSnakeBody
                      ? "bg-green-600 rounded-sm"
                      : isFood
                      ? "bg-red-500 rounded-full"
                      : "bg-gray-700"
                  }`}
                />
              );
            })}
          </div>

          {/* Controls */}
          <div className="mt-6 text-center text-white w-full">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">Controls:</p>
              <div className="grid grid-cols-3 gap-2 text-xs justify-items-center">
                <div></div>
                <div className="bg-gray-600 px-2 py-1 rounded">↑</div>
                <div></div>
                <div className="bg-gray-600 px-2 py-1 rounded">←</div>
                <div className="bg-gray-600 px-2 py-1 rounded">↓</div>
                <div className="bg-gray-600 px-2 py-1 rounded">→</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Press <span className="bg-gray-600 px-1 rounded">Space</span> to
              pause/resume
            </p>
            <p className="text-xs text-gray-400">
              Current direction:{" "}
              <span className="text-green-400">
                {getDirectionArrow(direction)}
              </span>
            </p>
            {gameMode === "WALL_PASS" && (
              <p className="text-xs text-blue-400 mt-1">
                Wall Pass Mode: Snake can pass through walls!
              </p>
            )}
          </div>

          {/* Game Status */}
          <div className="mt-4 text-center h-8">
            {!gameStarted && (
              <p className="text-yellow-400 mb-2">
                Press any arrow key to start
              </p>
            )}
          </div>

          {/* Game Over Button */}
          <div className="mt-4 text-center h-12">
            {gameOver && !showNameInput && (
              <button
                onClick={resetGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Play Again
              </button>
            )}
          </div>

          {/* Name Input Modal */}
          {showNameInput && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-green-400 mb-4">
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
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-400 mb-4"
                  />

                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={submitName}
                      disabled={!playerName.trim()}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
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

        {/* Scoreboard Modal */}
        {showScoreboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-400">
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
                          ({getModeDisplayName(entry.mode)})
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
