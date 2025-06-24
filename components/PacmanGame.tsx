"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  position: Position;
  direction: Direction;
  color: string;
  mode: "CHASE" | "SCATTER" | "FRIGHTENED";
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface ScoreEntry {
  score: number;
  date: string;
  timestamp: number;
  playerName: string;
  level: number;
}

type GameState = "PLAYING" | "PAUSED" | "GAME_OVER";

const MAZE_WIDTH = 28;
const MAZE_HEIGHT = 31;

const STORAGE_KEY = "pacman-game-scores";

// Simplified maze layout (1 = wall, 0 = path, 2 = dot, 3 = power pellet)
const MAZE_LAYOUT = [
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 1,
  ],
  [
    1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1,
    1, 2, 1,
  ],
  [
    1, 3, 1, 0, 0, 1, 2, 1, 0, 0, 0, 1, 2, 1, 1, 2, 1, 0, 0, 0, 1, 2, 1, 0, 0,
    1, 3, 1,
  ],
  [
    1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1,
    1, 2, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 1,
  ],
  [
    1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1,
    1, 2, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2,
    2, 2, 1,
  ],
  [
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1,
    1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0,
    0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0,
    0, 0, 0,
  ],
  [
    1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1, 1, 1,
    1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0,
    0, 0, 0,
  ],
  [
    1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 2, 1, 1, 1,
    1, 1, 1,
  ],
  [
    0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0,
    0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0,
    0, 0, 0,
  ],
  [
    1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1,
    1, 1, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 1,
  ],
  [
    1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1,
    1, 2, 1,
  ],
  [
    1, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2,
    2, 2, 1,
  ],
  [
    1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2,
    1, 1, 1,
  ],
  [
    1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2,
    1, 1, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2,
    2, 2, 1,
  ],
  [
    1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 2, 1,
  ],
  [
    1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 2, 1,
  ],
  [
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 1,
  ],
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1,
  ],
];

export default function PacmanGame() {
  const [maze, setMaze] = useState<number[][]>(
    MAZE_LAYOUT.map((row) => [...row])
  );
  const [pacmanPosition, setPacmanPosition] = useState<Position>({
    x: 14,
    y: 23,
  });
  const [pacmanDirection, setPacmanDirection] = useState<Direction>("LEFT");
  const [ghosts, setGhosts] = useState<Ghost[]>([
    {
      position: { x: 13, y: 11 },
      direction: "LEFT",
      color: "bg-red-500",
      mode: "CHASE",
    },
    {
      position: { x: 14, y: 11 },
      direction: "UP",
      color: "bg-pink-400",
      mode: "CHASE",
    },
    {
      position: { x: 15, y: 11 },
      direction: "RIGHT",
      color: "bg-cyan-400",
      mode: "CHASE",
    },
    {
      position: { x: 16, y: 11 },
      direction: "DOWN",
      color: "bg-orange-400",
      mode: "CHASE",
    },
  ]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>("PLAYING");
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [currentHighScore, setCurrentHighScore] = useState(0);
  const [dotsRemaining, setDotsRemaining] = useState(0);
  const [powerMode, setPowerMode] = useState(false);
  const [powerModeTime, setPowerModeTime] = useState(0);
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
    // Count initial dots
    const dotCount = maze
      .flat()
      .filter((cell) => cell === 2 || cell === 3).length;
    setDotsRemaining(dotCount);
  }, [loadHighScores, maze]);

  // Check if position is valid
  const isValidPosition = useCallback(
    (pos: Position): boolean => {
      return (
        pos.x >= 0 &&
        pos.x < MAZE_WIDTH &&
        pos.y >= 0 &&
        pos.y < MAZE_HEIGHT &&
        maze[pos.y][pos.x] !== 1
      );
    },
    [maze]
  );

  // Move Pac-Man
  const movePacman = useCallback(
    (direction: Direction) => {
      const newPosition = { ...pacmanPosition };

      switch (direction) {
        case "UP":
          newPosition.y -= 1;
          break;
        case "DOWN":
          newPosition.y += 1;
          break;
        case "LEFT":
          newPosition.x -= 1;
          break;
        case "RIGHT":
          newPosition.x += 1;
          break;
      }

      // Handle tunnel
      if (newPosition.x < 0) newPosition.x = MAZE_WIDTH - 1;
      if (newPosition.x >= MAZE_WIDTH) newPosition.x = 0;

      if (isValidPosition(newPosition)) {
        setPacmanPosition(newPosition);
        setPacmanDirection(direction);

        // Collect dots
        const cell = maze[newPosition.y][newPosition.x];
        if (cell === 2) {
          const newMaze = maze.map((row) => [...row]);
          newMaze[newPosition.y][newPosition.x] = 0;
          setMaze(newMaze);
          setScore((prev) => prev + 10);
          setDotsRemaining((prev) => prev - 1);
        } else if (cell === 3) {
          const newMaze = maze.map((row) => [...row]);
          newMaze[newPosition.y][newPosition.x] = 0;
          setMaze(newMaze);
          setScore((prev) => prev + 50);
          setDotsRemaining((prev) => prev - 1);
          setPowerMode(true);
          setPowerModeTime(10); // 10 seconds of power mode
        }
      }
    },
    [pacmanPosition, maze, isValidPosition]
  );

  // Move ghosts
  const moveGhosts = useCallback(() => {
    setGhosts((prevGhosts) =>
      prevGhosts.map((ghost, ghostIndex) => {
        const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
        const validDirections = directions.filter((dir) => {
          const newPos = { ...ghost.position };
          switch (dir) {
            case "UP":
              newPos.y -= 1;
              break;
            case "DOWN":
              newPos.y += 1;
              break;
            case "LEFT":
              newPos.x -= 1;
              break;
            case "RIGHT":
              newPos.x += 1;
              break;
          }

          // Handle tunnel
          if (newPos.x < 0) newPos.x = MAZE_WIDTH - 1;
          if (newPos.x >= MAZE_WIDTH) newPos.x = 0;

          return isValidPosition(newPos);
        });

        if (validDirections.length > 0) {
          let newDirection = ghost.direction;
          const newPosition = { ...ghost.position };

          // Different ghost personalities
          if (powerMode) {
            // In power mode, ghosts try to run away from Pac-Man
            const distances = validDirections.map((dir) => {
              const testPos = { ...ghost.position };
              switch (dir) {
                case "UP":
                  testPos.y -= 1;
                  break;
                case "DOWN":
                  testPos.y += 1;
                  break;
                case "LEFT":
                  testPos.x -= 1;
                  break;
                case "RIGHT":
                  testPos.x += 1;
                  break;
              }
              if (testPos.x < 0) testPos.x = MAZE_WIDTH - 1;
              if (testPos.x >= MAZE_WIDTH) testPos.x = 0;

              const distance =
                Math.abs(testPos.x - pacmanPosition.x) +
                Math.abs(testPos.y - pacmanPosition.y);
              return { direction: dir, distance };
            });

            // Choose direction that maximizes distance from Pac-Man
            const bestDirection = distances.reduce((best, current) =>
              current.distance > best.distance ? current : best
            );
            newDirection = bestDirection.direction;
          } else {
            // Normal chase mode with different personalities
            switch (ghostIndex) {
              case 0: // Red ghost - directly chases Pac-Man
                const redDistances = validDirections.map((dir) => {
                  const testPos = { ...ghost.position };
                  switch (dir) {
                    case "UP":
                      testPos.y -= 1;
                      break;
                    case "DOWN":
                      testPos.y += 1;
                      break;
                    case "LEFT":
                      testPos.x -= 1;
                      break;
                    case "RIGHT":
                      testPos.x += 1;
                      break;
                  }
                  if (testPos.x < 0) testPos.x = MAZE_WIDTH - 1;
                  if (testPos.x >= MAZE_WIDTH) testPos.x = 0;

                  const distance =
                    Math.abs(testPos.x - pacmanPosition.x) +
                    Math.abs(testPos.y - pacmanPosition.y);
                  return { direction: dir, distance };
                });

                // Choose direction that minimizes distance to Pac-Man
                const redBestDirection = redDistances.reduce((best, current) =>
                  current.distance < best.distance ? current : best
                );
                newDirection = redBestDirection.direction;
                break;

              case 1: // Pink ghost - tries to ambush Pac-Man (4 tiles ahead)
                const targetPos = { ...pacmanPosition };
                switch (pacmanDirection) {
                  case "UP":
                    targetPos.y -= 4;
                    break;
                  case "DOWN":
                    targetPos.y += 4;
                    break;
                  case "LEFT":
                    targetPos.x -= 4;
                    break;
                  case "RIGHT":
                    targetPos.x += 4;
                    break;
                }

                const pinkDistances = validDirections.map((dir) => {
                  const testPos = { ...ghost.position };
                  switch (dir) {
                    case "UP":
                      testPos.y -= 1;
                      break;
                    case "DOWN":
                      testPos.y += 1;
                      break;
                    case "LEFT":
                      testPos.x -= 1;
                      break;
                    case "RIGHT":
                      testPos.x += 1;
                      break;
                  }
                  if (testPos.x < 0) testPos.x = MAZE_WIDTH - 1;
                  if (testPos.x >= MAZE_WIDTH) testPos.x = 0;

                  const distance =
                    Math.abs(testPos.x - targetPos.x) +
                    Math.abs(testPos.y - targetPos.y);
                  return { direction: dir, distance };
                });

                const pinkBestDirection = pinkDistances.reduce(
                  (best, current) =>
                    current.distance < best.distance ? current : best
                );
                newDirection = pinkBestDirection.direction;
                break;

              case 2: // Cyan ghost - random movement with slight preference for Pac-Man
                if (Math.random() < 0.7) {
                  const cyanDistances = validDirections.map((dir) => {
                    const testPos = { ...ghost.position };
                    switch (dir) {
                      case "UP":
                        testPos.y -= 1;
                        break;
                      case "DOWN":
                        testPos.y += 1;
                        break;
                      case "LEFT":
                        testPos.x -= 1;
                        break;
                      case "RIGHT":
                        testPos.x += 1;
                        break;
                    }
                    if (testPos.x < 0) testPos.x = MAZE_WIDTH - 1;
                    if (testPos.x >= MAZE_WIDTH) testPos.x = 0;

                    const distance =
                      Math.abs(testPos.x - pacmanPosition.x) +
                      Math.abs(testPos.y - pacmanPosition.y);
                    return { direction: dir, distance };
                  });

                  const cyanBestDirection = cyanDistances.reduce(
                    (best, current) =>
                      current.distance < best.distance ? current : best
                  );
                  newDirection = cyanBestDirection.direction;
                } else {
                  newDirection =
                    validDirections[
                      Math.floor(Math.random() * validDirections.length)
                    ];
                }
                break;

              case 3: // Orange ghost - chases when far, runs when close
                const distanceToPacman =
                  Math.abs(ghost.position.x - pacmanPosition.x) +
                  Math.abs(ghost.position.y - pacmanPosition.y);

                if (distanceToPacman > 8) {
                  // Chase when far
                  const orangeDistances = validDirections.map((dir) => {
                    const testPos = { ...ghost.position };
                    switch (dir) {
                      case "UP":
                        testPos.y -= 1;
                        break;
                      case "DOWN":
                        testPos.y += 1;
                        break;
                      case "LEFT":
                        testPos.x -= 1;
                        break;
                      case "RIGHT":
                        testPos.x += 1;
                        break;
                    }
                    if (testPos.x < 0) testPos.x = MAZE_WIDTH - 1;
                    if (testPos.x >= MAZE_WIDTH) testPos.x = 0;

                    const distance =
                      Math.abs(testPos.x - pacmanPosition.x) +
                      Math.abs(testPos.y - pacmanPosition.y);
                    return { direction: dir, distance };
                  });

                  const orangeBestDirection = orangeDistances.reduce(
                    (best, current) =>
                      current.distance < best.distance ? current : best
                  );
                  newDirection = orangeBestDirection.direction;
                } else {
                  // Run when close
                  const orangeDistances = validDirections.map((dir) => {
                    const testPos = { ...ghost.position };
                    switch (dir) {
                      case "UP":
                        testPos.y -= 1;
                        break;
                      case "DOWN":
                        testPos.y += 1;
                        break;
                      case "LEFT":
                        testPos.x -= 1;
                        break;
                      case "RIGHT":
                        testPos.x += 1;
                        break;
                    }
                    if (testPos.x < 0) testPos.x = MAZE_WIDTH - 1;
                    if (testPos.x >= MAZE_WIDTH) testPos.x = 0;

                    const distance =
                      Math.abs(testPos.x - pacmanPosition.x) +
                      Math.abs(testPos.y - pacmanPosition.y);
                    return { direction: dir, distance };
                  });

                  const orangeBestDirection = orangeDistances.reduce(
                    (best, current) =>
                      current.distance > best.distance ? current : best
                  );
                  newDirection = orangeBestDirection.direction;
                }
                break;
            }
          }

          // Apply the chosen direction
          switch (newDirection) {
            case "UP":
              newPosition.y -= 1;
              break;
            case "DOWN":
              newPosition.y += 1;
              break;
            case "LEFT":
              newPosition.x -= 1;
              break;
            case "RIGHT":
              newPosition.x += 1;
              break;
          }

          // Handle tunnel
          if (newPosition.x < 0) newPosition.x = MAZE_WIDTH - 1;
          if (newPosition.x >= MAZE_WIDTH) newPosition.x = 0;

          return { ...ghost, position: newPosition, direction: newDirection };
        }

        return ghost;
      })
    );
  }, [isValidPosition, pacmanPosition, pacmanDirection, powerMode]);

  // Check ghost collision
  const checkGhostCollision = useCallback(() => {
    const collision = ghosts.some(
      (ghost) =>
        ghost.position.x === pacmanPosition.x &&
        ghost.position.y === pacmanPosition.y
    );

    if (collision) {
      if (powerMode) {
        // Eat ghost
        setScore((prev) => prev + 200);
        setGhosts((prev) =>
          prev.filter(
            (ghost) =>
              !(
                ghost.position.x === pacmanPosition.x &&
                ghost.position.y === pacmanPosition.y
              )
          )
        );
      } else {
        // Lose life
        setLives((prev) => prev - 1);
        if (lives <= 1) {
          handleGameOver();
        } else {
          // Reset positions
          setPacmanPosition({ x: 14, y: 23 });
          setGhosts([
            {
              position: { x: 13, y: 11 },
              direction: "LEFT",
              color: "bg-red-500",
              mode: "CHASE",
            },
            {
              position: { x: 14, y: 11 },
              direction: "UP",
              color: "bg-pink-400",
              mode: "CHASE",
            },
            {
              position: { x: 15, y: 11 },
              direction: "RIGHT",
              color: "bg-cyan-400",
              mode: "CHASE",
            },
            {
              position: { x: 16, y: 11 },
              direction: "DOWN",
              color: "bg-orange-400",
              mode: "CHASE",
            },
          ]);
        }
      }
    }
  }, [pacmanPosition, ghosts, powerMode, lives, handleGameOver]);

  // Check level completion
  const checkLevelComplete = useCallback(() => {
    if (dotsRemaining === 0) {
      setLevel((prev) => prev + 1);
      setMaze(MAZE_LAYOUT.map((row) => [...row]));
      setPacmanPosition({ x: 14, y: 23 });
      setGhosts([
        {
          position: { x: 13, y: 11 },
          direction: "LEFT",
          color: "bg-red-500",
          mode: "CHASE",
        },
        {
          position: { x: 14, y: 11 },
          direction: "UP",
          color: "bg-pink-400",
          mode: "CHASE",
        },
        {
          position: { x: 15, y: 11 },
          direction: "RIGHT",
          color: "bg-cyan-400",
          mode: "CHASE",
        },
        {
          position: { x: 16, y: 11 },
          direction: "DOWN",
          color: "bg-orange-400",
          mode: "CHASE",
        },
      ]);
      const dotCount = MAZE_LAYOUT.flat().filter(
        (cell) => cell === 2 || cell === 3
      ).length;
      setDotsRemaining(dotCount);
    }
  }, [dotsRemaining]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (gameState === "GAME_OVER") return;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          movePacman("UP");
          break;
        case "ArrowDown":
          event.preventDefault();
          movePacman("DOWN");
          break;
        case "ArrowLeft":
          event.preventDefault();
          movePacman("LEFT");
          break;
        case "ArrowRight":
          event.preventDefault();
          movePacman("RIGHT");
          break;
        case "p":
        case "P":
          event.preventDefault();
          setGameState((prev) => (prev === "PLAYING" ? "PAUSED" : "PLAYING"));
          break;
      }
    },
    [gameState, movePacman]
  );

  // Game loop
  const gameLoop = useCallback(
    (time: number) => {
      if (gameState !== "PLAYING") return;

      if (time - lastTimeRef.current > 150) {
        // Move every 150ms (faster than before)
        movePacman(pacmanDirection);
        moveGhosts();
        checkGhostCollision();
        checkLevelComplete();
        lastTimeRef.current = time;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    },
    [
      gameState,
      movePacman,
      pacmanDirection,
      moveGhosts,
      checkGhostCollision,
      checkLevelComplete,
    ]
  );

  // Power mode timer
  useEffect(() => {
    if (powerMode && powerModeTime > 0) {
      const timer = setTimeout(() => {
        setPowerModeTime((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (powerModeTime === 0) {
      setPowerMode(false);
    }
  }, [powerMode, powerModeTime]);

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
    setMaze(MAZE_LAYOUT.map((row) => [...row]));
    setPacmanPosition({ x: 14, y: 23 });
    setPacmanDirection("LEFT");
    setGhosts([
      {
        position: { x: 13, y: 11 },
        direction: "LEFT",
        color: "bg-red-500",
        mode: "CHASE",
      },
      {
        position: { x: 14, y: 11 },
        direction: "UP",
        color: "bg-pink-400",
        mode: "CHASE",
      },
      {
        position: { x: 15, y: 11 },
        direction: "RIGHT",
        color: "bg-cyan-400",
        mode: "CHASE",
      },
      {
        position: { x: 16, y: 11 },
        direction: "DOWN",
        color: "bg-orange-400",
        mode: "CHASE",
      },
    ]);
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameState("PLAYING");
    setShowNameInput(false);
    setPlayerName("");
    setPowerMode(false);
    setPowerModeTime(0);
    const dotCount = MAZE_LAYOUT.flat().filter(
      (cell) => cell === 2 || cell === 3
    ).length;
    setDotsRemaining(dotCount);
    lastTimeRef.current = 0;
  }, []);

  const clearHighScores = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHighScores([]);
    setCurrentHighScore(0);
  };

  // Render maze cell
  const renderCell = (y: number, x: number) => {
    const cell = maze[y][x];
    const isPacman = pacmanPosition.x === x && pacmanPosition.y === y;
    const ghost = ghosts.find((g) => g.position.x === x && g.position.y === y);

    let cellContent = null;
    let cellClass = "w-5 h-5 border border-gray-600 ";

    if (isPacman) {
      cellContent = (
        <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <div
            className={`w-2 h-2 bg-gray-900 rounded-full ${
              pacmanDirection === "LEFT"
                ? "ml-1"
                : pacmanDirection === "RIGHT"
                ? "mr-1"
                : ""
            }`}
          ></div>
        </div>
      );
    } else if (ghost) {
      cellClass += powerMode ? "bg-blue-400" : ghost.color;
      cellContent = <div className="w-4 h-4 rounded-full"></div>;
    } else if (cell === 1) {
      cellClass += "bg-blue-600";
    } else if (cell === 2) {
      cellContent = <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>;
    } else if (cell === 3) {
      cellContent = <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>;
    } else {
      cellClass += "bg-black";
    }

    return (
      <div key={`${y}-${x}`} className={cellClass}>
        {cellContent}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Pac-Man</h1>
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
            {powerMode && (
              <p className="text-blue-400 font-bold">
                Power Mode: {powerModeTime}s
              </p>
            )}
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
          <div className="border-2 border-gray-600 bg-black p-2">
            <div
              className="grid gap-0"
              style={{ gridTemplateColumns: `repeat(${MAZE_WIDTH}, 1fr)` }}
            >
              {maze.map((row, y) => row.map((_, x) => renderCell(y, x)))}
            </div>
          </div>

          {/* Side Panel */}
          <div className="text-white">
            {/* Controls */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Controls:</h3>
              <div className="text-sm space-y-1">
                <p>← → ↑ ↓ Move</p>
                <p>P Pause</p>
              </div>
            </div>

            {/* Game Info */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Game Info:</h3>
              <div className="text-sm space-y-1">
                <p>Dots Remaining: {dotsRemaining}</p>
                <p>
                  Power Pellets:{" "}
                  {maze.flat().filter((cell) => cell === 3).length}
                </p>
              </div>
            </div>

            {/* Game Over Button */}
            {gameState === "GAME_OVER" && !showNameInput && (
              <button
                onClick={resetGame}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Play Again
              </button>
            )}

            {/* Scoreboard Button */}
            <div className="mt-4">
              <button
                onClick={() => setShowScoreboard(!showScoreboard)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors"
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
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 mb-4"
                />

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={submitName}
                    disabled={!playerName.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
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
                <h2 className="text-2xl font-bold text-yellow-400">
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
