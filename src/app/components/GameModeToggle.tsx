import { GameModeProps } from "../interfaces";

export default function GameModeToggle({ gameMode, setGameMode }: GameModeProps) {
    return (
        <div className="hidden sm:flex rounded-lg shadow-sm sm:mt-2" role="group">
            <button
                type="button"
                className={`px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-l-lg hover:bg-gray-600 focus:z-10 focus:ring-2 focus:ring-gray-500 ${
                    gameMode === "Endless" ? "bg-gray-900" : ""
                }`}
                onClick={() => setGameMode("Endless")}
            >
                Endless
            </button>
            <button
                type="button"
                className={`px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-r-lg hover:bg-gray-600 focus:z-10 focus:ring-2 focus:ring-gray-500 ${
                    gameMode === "Daily" ? "bg-gray-900" : ""
                }`}
                onClick={() => setGameMode("Daily")}
            >
                Daily
            </button>
        </div>
    );
}
