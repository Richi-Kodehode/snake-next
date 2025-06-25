import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl max-w-4xl w-full border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
            Arcade Games
          </h1>
          <p className="text-white/80 text-xl font-light">
            Classic games reimagined for the web
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Snake Game Card */}
          <Link href="/snake" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:scale-105 shadow-lg hover:shadow-2xl h-80 flex flex-col">
              <div className="text-center flex-1 flex flex-col">
                <div className="text-5xl mb-4 filter drop-shadow-lg">🐍</div>
                <h2 className="text-2xl font-bold text-green-300 mb-3">
                  Snake Game
                </h2>
                <p className="text-white/80 mb-4 text-sm leading-relaxed flex-1">
                  Classic snake game with modern features. Collect food, grow
                  your snake, and try to beat your high score!
                </p>
                <div className="space-y-2 text-xs text-white/60 mt-auto">
                  <div className="flex justify-between">
                    <span>Modes:</span>
                    <span className="text-green-300">Classic, Wall Pass</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Features:</span>
                    <span className="text-green-300">
                      High Scores, Name Input
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Tetris Game Card */}
          <Link href="/tetris" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:scale-105 shadow-lg hover:shadow-2xl h-80 flex flex-col">
              <div className="text-center flex-1 flex flex-col">
                <div className="text-5xl mb-4 filter drop-shadow-lg">🧩</div>
                <h2 className="text-2xl font-bold text-blue-300 mb-3">
                  Tetris
                </h2>
                <p className="text-white/80 mb-4 text-sm leading-relaxed flex-1">
                  Classic block-stacking puzzle game. Rotate and place pieces to
                  clear lines and advance levels!
                </p>
                <div className="space-y-2 text-xs text-white/60 mt-auto">
                  <div className="flex justify-between">
                    <span>Features:</span>
                    <span className="text-blue-300">7 Tetrominoes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scoring:</span>
                    <span className="text-blue-300">Level System</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Pac-Man Game Card */}
          <Link href="/pacman" className="group">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20 hover:border-white/40 hover:scale-105 shadow-lg hover:shadow-2xl h-80 flex flex-col">
              <div className="text-center flex-1 flex flex-col">
                <div className="text-5xl mb-4 filter drop-shadow-lg">👻</div>
                <h2 className="text-2xl font-bold text-yellow-300 mb-3">
                  Pac-Man
                </h2>
                <p className="text-white/80 mb-4 text-sm leading-relaxed flex-1">
                  Navigate the maze, collect dots, avoid ghosts, and eat power
                  pellets to turn the tables!
                </p>
                <div className="space-y-2 text-xs text-white/60 mt-auto">
                  <div className="flex justify-between">
                    <span>Features:</span>
                    <span className="text-yellow-300">
                      Ghost AI, Power Mode
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scoring:</span>
                    <span className="text-yellow-300">
                      Dots, Ghosts, Levels
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-white/20">
          <p className="text-white/60 text-sm font-light">
            More classic arcade games coming soon! 🎮
          </p>
        </div>
      </div>
    </div>
  );
}
