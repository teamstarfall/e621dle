export default function Scoreboard({ gameMode, currentStreak, bestStreak, roundResults }: any) {
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
                <></>
            )}
        </div>
    );
}
