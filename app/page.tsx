import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 shadow-2xl max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-green-400 mb-4">
            Arcade Games
          </h1>
          <p className="text-gray-300 text-lg">
            Classic games reimagined for the web
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Snake Game Card */}
          <Link href="/snake" className="group">
            <div className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">🐍</div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">
                  Snake Game
                </h2>
                <p className="text-gray-300 mb-4">
                  Classic snake game with modern features. Collect food, grow
                  your snake, and try to beat your high score!
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Modes:</span>
                    <span>Classic, Wall Pass</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Features:</span>
                    <span>High Scores, Name Input</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Tetris Game Card */}
          <Link href="/tetris" className="group">
            <div className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">🧩</div>
                <h2 className="text-2xl font-bold text-blue-400 mb-2">
                  Tetris
                </h2>
                <p className="text-gray-300 mb-4">
                  Classic block-stacking puzzle game. Rotate and place pieces to
                  clear lines and advance levels!
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Features:</span>
                    <span>7 Tetrominoes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scoring:</span>
                    <span>Level System</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Pong Game Card (Placeholder) */}
          <div className="bg-gray-700 rounded-lg p-6 opacity-50">
            <div className="text-center">
              <div className="text-4xl mb-4">🏓</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Pong</h2>
              <p className="text-gray-300 mb-4">
                Coming soon! The original arcade tennis game.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>Coming Soon</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pac-Man Game Card */}
          <Link href="/pacman" className="group">
            <div className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">👻</div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                  Pac-Man
                </h2>
                <p className="text-gray-300 mb-4">
                  Navigate the maze, collect dots, avoid ghosts, and eat power
                  pellets to turn the tables!
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Features:</span>
                    <span>Ghost AI, Power Mode</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scoring:</span>
                    <span>Dots, Ghosts, Levels</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Space Invaders Game Card */}
          <Link href="/space-invaders" className="group">
            <div className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors cursor-pointer">
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">
                  Space Invaders
                </h2>
                <p className="text-gray-300 mb-4">
                  Defend Earth from alien invasion! Shoot down the alien
                  formations before they reach the bottom.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Features:</span>
                    <span>Alien AI, Levels</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scoring:</span>
                    <span>High Scores, Name Input</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Breakout Game Card (Placeholder) */}
          <div className="bg-gray-700 rounded-lg p-6 opacity-50">
            <div className="text-center">
              <div className="text-4xl mb-4">🏀</div>
              <h2 className="text-2xl font-bold text-orange-400 mb-2">
                Breakout
              </h2>
              <p className="text-gray-300 mb-4">
                Coming soon! Break all the blocks with your paddle.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-gray-600">
          <p className="text-gray-400 text-sm">
            More classic arcade games coming soon! 🎮
          </p>
        </div>
      </div>
    </div>
  );
}
