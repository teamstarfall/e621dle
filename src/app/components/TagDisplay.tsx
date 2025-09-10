import { TagDisplayProps } from "../interfaces";
import ImageCard from "./ImageCard";

function AnimatedNumber({
    isRevealed,
    animatedCount,
    tagCount,
}: {
    isRevealed: boolean;
    animatedCount?: number;
    tagCount: number;
}) {
    const displayCount = () => {
        if (!isRevealed) {
            return "?";
        }
        // If the animation is running, show the animated count, otherwise show the final tag count.
        return (animatedCount !== undefined ? animatedCount : tagCount).toLocaleString();
    };

    return <span className="text-[32px] md:text-[42px] font-bold leading-none">{displayCount()}</span>;
}

export default function TagDisplay({
    tag,
    isRevealed,
    handleChoice,
    choice,
    getCategoryName,
    animatedCount,
    ratings: selectedRatings,
}: TagDisplayProps) {
    if (!tag) {
        return null;
    }

    return (
        <div
            className={`flex flex-col grow gap-[12px] w-full h-full p-1 md:p-6 mx-[20px] bg-[#071e32] border-gray-300 rounded-xl shadow-xl ring ring-gray-500 ${
                isRevealed ? "cursor-not-allowed" : "cursor-pointer"
            } hover:border-white hover:ring-4 hover:ring-white hover:-translate-y-2 transition-all`}
            onClick={() => handleChoice(choice)}
        >
            <span className="flex flex-col">
                <span className="font-bold text-[24px]">{tag.name}</span>
                <span className="italic text-[14px] leading-0 my-2">{getCategoryName(tag.category)}</span>
            </span>

            <div className="flex flex-col mb-[0px]">
                <span className="relative h-[200px] md:h-[300px] md:mb-[12px] mb-[6px] rounded-md overflow-hidden">
                    <ImageCard tag={tag} selectedRatings={selectedRatings} />
                </span>
                {choice === "lower" ? (
                    <span className="text-[32px] md:text-[42px] font-bold leading-none">
                        {tag.count.toLocaleString()}
                    </span>
                ) : (
                    <AnimatedNumber isRevealed={isRevealed} animatedCount={animatedCount} tagCount={tag.count} />
                )}
                <span>posts</span>
            </div>
        </div>
    );
}
