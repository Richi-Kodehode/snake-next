/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

interface Bullet {
  position: Position;
  isPlayer: boolean;
  id: number; // Add unique ID for proper collision detection
}

interface Alien {
  position: Position;
  type: number; // 0-2 for different alien types
  alive: boolean;
  id: number; // Add unique ID for each alien
}

interface ScoreEntry {
  score: number;
  date: string;
  timestamp: number;
  playerName: string;
  level: number;
}

type GameState = "PLAYING" | "PAUSED" | "GAME_OVER";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const ALIEN_WIDTH = 40;
const ALIEN_HEIGHT = 30;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 10;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 11;

const STORAGE_KEY = "space-invaders-scores";

export default function SpaceInvadersGame() {
  const [playerPosition, setPlayerPosition] = useState<Position>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 50,
  });
  const [aliens, setAliens] = useState<Alien[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [alienDirection, setAlienDirection] = useState(1); // 1 for right, -1 for left
  const [alienSpeed, setAlienSpeed] = useState(0.1); // Very slow initial speed
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>("PLAYING");
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const [lastShot, setLastShot] = useState(0);
  const [alienLastShot, setAlienLastShot] = useState(0);
  const [bulletIdCounter, setBulletIdCounter] = useState(0);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const playerPositionRef = useRef<Position>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 50,
  });
  const alienIdCounterRef = useRef(0);

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
          level: level,
        };

        const updatedScores = [...highScores, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScores));
        setHighScores(updatedScores);
        setCurrentHighScore(Math.max(...updatedScores.map((s) => s.score)));
      } catch (error) {
        console.error("Failed to save high score:", error);
      }
    },
    [highScores, level]
  );

  // Handle game over
  const handleGameOver = useCallback(() => {
    setGameState("GAME_OVER");
    if (score > 0) {
      setShowNameInput(true);
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

  // Initialize aliens
  const initializeAliens = useCallback(() => {
    const newAliens: Alien[] = [];
    for (let row = 0; row < ALIEN_ROWS; row++) {
      for (let col = 0; col < ALIEN_COLS; col++) {
        newAliens.push({
          position: { x: col * 60 + 100, y: row * 50 + 50 },
          type: Math.floor(row / 2), // 0, 1, or 2
          alive: true,
          id: alienIdCounterRef.current + (row * ALIEN_COLS + col),
        });
      }
    }
    alienIdCounterRef.current += ALIEN_ROWS * ALIEN_COLS;
    setAliens(newAliens);
  }, []);

  // Initialize game
  useEffect(() => {
    initializeAliens();
  }, [initializeAliens]);

  // Handle key down
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (gameState === "GAME_OVER") return;

      setKeysPressed((prev) => new Set(prev).add(event.key));

      if (event.key === " ") {
        event.preventDefault();
        firePlayerBullet();
      } else if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : "PLAYING"));
      }
    },
    [gameState]
  );

  // Handle key up
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setKeysPressed((prev) => {
      const newSet = new Set(prev);
      newSet.delete(event.key);
      return newSet;
    });
  }, []);

  // Move player
  const movePlayer = useCallback(() => {
    setPlayerPosition((prev) => {
      let newX = prev.x;

      if (keysPressed.has("ArrowLeft")) {
        newX = Math.max(0, newX - 5);
      }
      if (keysPressed.has("ArrowRight")) {
        newX = Math.min(GAME_WIDTH - PLAYER_WIDTH, newX + 5);
      }

      const newPosition = { x: newX, y: prev.y };
      playerPositionRef.current = newPosition; // Update ref with current position
      return newPosition;
    });
  }, [keysPressed]);

  // Fire player bullet
  const firePlayerBullet = useCallback(() => {
    const now = Date.now();
    if (now - lastShot > 300) {
      const newId = bulletIdCounter + 1;
      setBulletIdCounter(newId);

      // Use current player position from ref
      const currentPlayerPos = playerPositionRef.current;
      const bulletX = currentPlayerPos.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2;
      const bulletY = currentPlayerPos.y - BULLET_HEIGHT;

      setBullets((prev) => [
        ...prev,
        {
          position: { x: bulletX, y: bulletY },
          isPlayer: true,
          id: newId,
        },
      ]);
      setLastShot(now);
    }
  }, [lastShot, bulletIdCounter]);

  // Fire alien bullet
  const fireAlienBullet = useCallback(() => {
    const now = Date.now();
    const aliveAliens = aliens.filter((alien) => alien.alive);
    const fireRate = Math.max(4000 - level * 300, 1500);

    if (now - alienLastShot > fireRate && aliveAliens.length > 0) {
      const randomAlien =
        aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
      const newId = bulletIdCounter + 1;
      setBulletIdCounter(newId);
      setBullets((prev) => [
        ...prev,
        {
          position: {
            x: randomAlien.position.x + ALIEN_WIDTH / 2 - BULLET_WIDTH / 2,
            y: randomAlien.position.y + ALIEN_HEIGHT,
          },
          isPlayer: false,
          id: newId,
        },
      ]);
      setAlienLastShot(now);
    }
  }, [aliens, alienLastShot, level, bulletIdCounter]);

  // Move bullets
  const moveBullets = useCallback(() => {
    setBullets((prev) =>
      prev
        .map((bullet) => ({
          ...bullet,
          position: {
            x: bullet.position.x,
            y: bullet.position.y + (bullet.isPlayer ? -8 : 3),
          },
        }))
        .filter(
          (bullet) =>
            bullet.position.y > -BULLET_HEIGHT &&
            bullet.position.y < GAME_HEIGHT
        )
    );
  }, []);

  // Move aliens
  const moveAliens = useCallback(() => {
    setAliens((prev) => {
      const aliveAliens = prev.filter((alien) => alien.alive);
      if (aliveAliens.length === 0) return prev;

      // Find the leftmost and rightmost aliens
      let leftmostX = GAME_WIDTH;
      let rightmostX = 0;

      aliveAliens.forEach((alien) => {
        leftmostX = Math.min(leftmostX, alien.position.x);
        rightmostX = Math.max(rightmostX, alien.position.x);
      });

      // Check if we need to change direction
      let shouldChangeDirection = false;
      if (alienDirection > 0 && rightmostX + ALIEN_WIDTH >= GAME_WIDTH - 5) {
        shouldChangeDirection = true;
      } else if (alienDirection < 0 && leftmostX <= 5) {
        shouldChangeDirection = true;
      }

      // Move aliens
      const newAliens = prev.map((alien) => {
        if (!alien.alive) return alien;

        let newX = alien.position.x;
        let newY = alien.position.y;

        if (shouldChangeDirection) {
          // Drop down when changing direction
          newY += 5; // Reduced drop distance
        } else {
          // Move horizontally
          newX += alienDirection * alienSpeed;
        }

        return {
          ...alien,
          position: {
            x: Math.max(0, Math.min(GAME_WIDTH - ALIEN_WIDTH, newX)),
            y: newY,
          },
        };
      });

      // Change direction if needed
      if (shouldChangeDirection) {
        setAlienDirection((prev) => -prev);
      }

      return newAliens;
    });
  }, [alienDirection, alienSpeed]);

  // Check collisions
  const checkCollisions = useCallback(() => {
    setBullets((prevBullets) => {
      const newBullets = [...prevBullets];
      const bulletsToRemove: number[] = [];
      const aliensToKill: number[] = [];

      // Check each bullet
      newBullets.forEach((bullet, bulletIndex) => {
        if (bullet.isPlayer) {
          // Player bullet vs aliens
          aliens.forEach((alien, alienIndex) => {
            if (
              alien.alive &&
              bullet.position.x < alien.position.x + ALIEN_WIDTH &&
              bullet.position.x + BULLET_WIDTH > alien.position.x &&
              bullet.position.y < alien.position.y + ALIEN_HEIGHT &&
              bullet.position.y + BULLET_HEIGHT > alien.position.y
            ) {
              // Mark alien for removal and bullet for removal
              if (!aliensToKill.includes(alienIndex)) {
                aliensToKill.push(alienIndex);
              }
              if (!bulletsToRemove.includes(bulletIndex)) {
                bulletsToRemove.push(bulletIndex);
              }
            }
          });
        } else {
          // Alien bullet vs player
          if (
            bullet.position.x < playerPosition.x + PLAYER_WIDTH &&
            bullet.position.x + BULLET_WIDTH > playerPosition.x &&
            bullet.position.y < playerPosition.y + PLAYER_HEIGHT &&
            bullet.position.y + BULLET_HEIGHT > playerPosition.y
          ) {
            setLives((prev) => prev - 1);
            if (!bulletsToRemove.includes(bulletIndex)) {
              bulletsToRemove.push(bulletIndex);
            }
          }
        }
      });

      // Process alien kills AFTER checking all bullets
      if (aliensToKill.length > 0) {
        setAliens((prev) =>
          prev.map((alien, index) =>
            aliensToKill.includes(index) ? { ...alien, alive: false } : alien
          )
        );

        aliensToKill.forEach((alienIndex) => {
          const alien = aliens[alienIndex];
          const points = [30, 20, 10][alien.type];
          setScore((prev) => prev + points);
        });
      }

      // Return bullets with removed ones filtered out
      return newBullets.filter((_, index) => !bulletsToRemove.includes(index));
    });
  }, [aliens, playerPosition]);

  // Check level completion
  const checkLevelComplete = useCallback(() => {
    const aliveAliens = aliens.filter((alien) => alien.alive);
    if (aliveAliens.length === 0) {
      setLevel((prev) => prev + 1);
      setAlienSpeed((prev) => prev + 0.02); // Very small speed increase
      setBullets([]);
      initializeAliens();
    }
  }, [aliens, initializeAliens]);

  // Check game over conditions
  const checkGameOver = useCallback(() => {
    const aliensReachedBottom = aliens.some(
      (alien) =>
        alien.alive && alien.position.y + ALIEN_HEIGHT >= playerPosition.y - 30
    );

    if (lives <= 0 || aliensReachedBottom) {
      handleGameOver();
    }
  }, [aliens, lives, playerPosition, handleGameOver]);

  // Game loop
  const gameLoop = useCallback(
    (time: number) => {
      if (gameState !== "PLAYING") return;

      if (time - lastTimeRef.current > 16) {
        movePlayer();
        moveBullets();
        moveAliens();
        fireAlienBullet();
        checkCollisions();
        checkLevelComplete();
        checkGameOver();
        lastTimeRef.current = time;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    },
    [
      gameState,
      movePlayer,
      moveBullets,
      moveAliens,
      fireAlienBullet,
      checkCollisions,
      checkLevelComplete,
      checkGameOver,
    ]
  );

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

  // Keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Reset game
  const resetGame = useCallback(() => {
    const initialPosition = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50 };
    setPlayerPosition(initialPosition);
    playerPositionRef.current = initialPosition; // Reset ref
    setBullets([]);
    setAlienDirection(1);
    setAlienSpeed(0.1);
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameState("PLAYING");
    setShowNameInput(false);
    setPlayerName("");
    setLastShot(0);
    setAlienLastShot(0);
    setBulletIdCounter(0);
    alienIdCounterRef.current = 0; // Reset alien ID counter ref
    setKeysPressed(new Set());
    initializeAliens();
    lastTimeRef.current = 0;
  }, [initializeAliens]);

  const clearHighScores = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHighScores([]);
    setCurrentHighScore(0);
  };

  // Render alien
  const renderAlien = (alien: Alien) => {
    if (!alien.alive) return null;

    const colors = ["bg-green-500", "bg-yellow-500", "bg-red-500"];
    const alienColor = colors[alien.type];

    return (
      <div
        key={alien.id}
        className={`absolute ${alienColor} rounded-md shadow-lg border-2 border-gray-800`}
        style={{
          left: alien.position.x,
          top: alien.position.y,
          width: ALIEN_WIDTH,
          height: ALIEN_HEIGHT,
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-black font-bold text-lg">
          👾
        </div>
      </div>
    );
  };

  // Render bullet
  const renderBullet = (bullet: Bullet) => (
    <div
      key={bullet.id}
      className={`absolute ${
        bullet.isPlayer ? "bg-blue-500" : "bg-red-500"
      } rounded-sm shadow-lg`}
      style={{
        left: bullet.position.x,
        top: bullet.position.y,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        boxShadow: bullet.isPlayer ? "0 0 8px #3b82f6" : "0 0 8px #ef4444",
      }}
    />
  );

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-green-400 mb-2">
            Space Invaders
          </h1>
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
                Level: <span className="text-blue-400 font-bold">{level}</span>
              </p>
              <p>
                Lives: <span className="text-red-400 font-bold">{lives}</span>
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
          <div
            className="relative border-2 border-gray-600 bg-gradient-to-b from-black to-gray-900 rounded-lg overflow-hidden"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Player Ship */}
            <div
              className="absolute bg-blue-600 rounded-md shadow-lg border-2 border-blue-400"
              style={{
                left: playerPosition.x,
                top: playerPosition.y,
                width: PLAYER_WIDTH,
                height: PLAYER_HEIGHT,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.5)",
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                🚀
              </div>
            </div>

            {/* Aliens */}
            {aliens.map(renderAlien)}

            {/* Bullets */}
            {bullets.map(renderBullet)}
          </div>

          {/* Side Panel */}
          <div className="text-white">
            {/* Controls */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Controls:</h3>
              <div className="text-sm space-y-1">
                <p>← → Move</p>
                <p>Space Shoot</p>
                <p>P Pause</p>
              </div>
            </div>

            {/* Game Info */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Game Info:</h3>
              <div className="text-sm space-y-1">
                <p>Aliens Remaining: {aliens.filter((a) => a.alive).length}</p>
                <p>Alien Speed: {alienSpeed.toFixed(1)}</p>
                <p>Alien Fire Rate: {Math.max(4000 - level * 300, 1500)}ms</p>
              </div>
            </div>

            {/* Game Over Button */}
            {gameState === "GAME_OVER" && !showNameInput && (
              <button
                onClick={resetGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Play Again
              </button>
            )}

            {/* Scoreboard Button */}
            <div className="mt-4">
              <button
                onClick={() => setShowScoreboard(!showScoreboard)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
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
