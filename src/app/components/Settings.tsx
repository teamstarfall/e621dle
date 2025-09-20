import { GameMode } from "../interfaces";
import { useSettings } from "../storage";
import GameModeToggle from "./GameModeToggle";

export default function Settings({ gameMode, setGameMode }: { gameMode: GameMode; setGameMode: (mode: GameMode) => void }) {
    const { ratingLevel, setRatingLevel, characterTagsOnly, setCharacterTagsOnly, pause, setPause } = useSettings();

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setCharacterTagsOnly(isChecked);
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-col items-center gap-2">
                <div className="block sm:hidden text-center">
                    <label className="whitespace-nowrap mb-2">Game Mode</label>
                    <GameModeToggle gameMode={gameMode} setGameMode={setGameMode} />
                </div>
                <div className="text-center">
                    <label className="whitespace-nowrap mb-2">Show Ratings</label>
                    <div className="flex rounded-lg shadow-sm" role="group">
                        <div className="relative group">
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-l-lg hover:bg-gray-600 focus:z-10 focus:ring-2 focus:ring-gray-500 ${
                                    ratingLevel === "No Images" ? "bg-gray-900 font-bold" : ""
                                }`}
                                onClick={() => setRatingLevel("No Images")}
                            >
                                🚫
                            </button>
                            <div
                                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap tooltip-transition opacity-0 pointer-events-none group-hover:opacity-100`}
                            >
                                No Images
                            </div>
                        </div>
                        <div className="relative group">
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-green-600 focus:z-10 focus:ring-2 focus:ring-green-500 ${
                                    ratingLevel === "Safe" ? "bg-green-900" : ""
                                }`}
                                onClick={() => setRatingLevel("Safe")}
                            >
                                S
                            </button>
                            <div
                                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap tooltip-transition opacity-0 pointer-events-none group-hover:opacity-100`}
                            >
                                Safe
                            </div>
                        </div>
                        <div className="relative group">
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-yellow-600 focus:z-10 focus:ring-2 focus:ring-yellow-500 ${
                                    ratingLevel === "Questionable" ? "bg-yellow-900" : ""
                                }`}
                                onClick={() => setRatingLevel("Questionable")}
                            >
                                Q
                            </button>
                            <div
                                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap tooltip-transition opacity-0 pointer-events-none group-hover:opacity-100`}
                            >
                                Questionable
                            </div>
                        </div>
                        <div className="relative group">
                            <button
                                type="button"
                                className={`px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-r-lg hover:bg-red-600 focus:z-10 focus:ring-2 focus:ring-red-500 ${
                                    ratingLevel === "Explicit" ? "bg-red-900" : ""
                                }`}
                                onClick={() => setRatingLevel("Explicit")}
                            >
                                E
                            </button>
                            <div
                                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap tooltip-transition opacity-0 pointer-events-none group-hover:opacity-100`}
                            >
                                Explicit
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative flex items-center mt-2 group">
                <input
                    type="checkbox"
                    id="character-toggle"
                    disabled={gameMode === "Daily"}
                    checked={characterTagsOnly || false}
                    onChange={handleToggle}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="character-toggle" className="whitespace-nowrap ml-2">
                    Characters Only
                </label>
                <div
                    className={`absolute bottom-full mb-2 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap tooltip-transition opacity-0 pointer-events-none group-hover:opacity-100`}
                >
                    Will apply on next <b>Endless</b> game.
                </div>
            </div>
            <div className="relative flex items-center mt-2">
                <input
                    type="checkbox"
                    id="pause-toggle"
                    checked={pause || false}
                    onChange={(ev) => setPause(ev.currentTarget.checked)}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="pause-toggle" className="whitespace-nowrap ml-2">
                    Pause before showing next tag
                </label>
            </div>
        </div>
    );
}
