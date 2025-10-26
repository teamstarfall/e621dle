import { MAX_ROUNDS } from "../constants";
import { RoundResult, ScoreboardProps } from "../interfaces";

export default function Scoreboard({
    gameMode,
    currentStreak,
    bestStreak,
    roundResults,
    showProgress,
    isViewingRound,
}: ScoreboardProps) {
    const getColorValue = (value: RoundResult) => {
        switch (value) {
            case "u":
                return "bg-stone-200";
            case "i":
                return "bg-red-500";
            case "c":
                return "bg-green-500";
        }
    };

    const getRound = () => {
        if (!roundResults) return 1;

        const index = roundResults.results.indexOf("u");
        if (index === -1) return MAX_ROUNDS;
        else return index + 1;
    };

    return (
        <div className="flex flex-row items-center px-2 py-1 sm:px-4 sm:py-2 border-1 rounded-xl bg-[#071e32] justify-items-center">
            {gameMode === "Endless" ? (
                <>
                    <span className="flex flex-row text-center justify-center items-center">
                        <span className="font-bold whitespace-nowrap">Current</span>
                        <span className="font-bold text-[24px] sm:text-[32px] ml-2">{currentStreak}</span>
                    </span>
                    <div className="h-4 sm:h-8 w-px bg-gray-400 mx-2" />
                    <span className="flex flex-row text-center justify-center items-center">
                        <span className="font-bold whitespace-nowrap">Best</span>
                        <span className="font-bold text-[24px] sm:text-[32px] ml-2">{bestStreak}</span>
                    </span>
                </>
            ) : (
                <div className="flex flex-col items-center gap-1">
                    {showProgress && <div>{`${isViewingRound ? "Viewing" : ""} Round ${getRound()} of ${MAX_ROUNDS}`}</div>}
                    <div className="flex flex-row items-center gap-1">
                        {roundResults?.results.slice(0, MAX_ROUNDS).map((value: RoundResult, index: number) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!isViewingRound}
                                className={`text-center text-[12px] sm:text-[18px] rounded-sm transition-all h-[18px] w-[18px] sm:h-[24px] sm:w-[24px] ${getColorValue(
                                    value
                                )}`}
                            >
                                {index < getRound() - 1 ? (value === "c" ? "✔" : "✘") : ""}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
