import PacmanGame from "@/components/PacmanGame";
import Link from "next/link";

export default function PacmanPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header with back button */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2"
        >
          ← Back to Games
        </Link>
      </div>

      {/* Pac-Man Game */}
      <PacmanGame />
    </div>
  );
}
