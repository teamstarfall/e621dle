import { TagCardProps as TagCardProps, ImagePreviews } from "../interfaces";
import { useMemo } from "react";
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

const buttonClasses =
    "bg-[#071e32] border-gray-300 rounded-xl shadow-xl ring ring-gray-500 hover:border-white hover:ring-4 hover:ring-white hover:bg-[#1f3c67] transition-all";
export default function TagCard({
    tag,
    isRevealed,
    handleChoice,
    choice,
    getCategoryName,
    animatedCount,
    ratingLevel,
}: TagCardProps) {
    const sourceLink = useMemo(() => {
        if (!tag) {
            return null;
        }
        const rating = ratingLevel.toLowerCase();
        if (rating === "no images") {
            return null;
        }
        const image = tag.images[rating as keyof ImagePreviews];
        if (image?.id) {
            return `https://e621.net/posts/${image.id}`;
        }
        return null;
    }, [tag, ratingLevel]);

    if (!tag) {
        return null;
    }

    return (
        <div className="w-full">
            <div className="group flex flex-col grow">
                <button
                    type="button"
                    className={`flex flex-col gap-[12px] w-full h-full p-1 md:p-6 group-hover:-translate-y-2 ${
                        isRevealed ? "cursor-not-allowed" : "cursor-pointer"
                    } ${buttonClasses}`}
                    onClick={() => handleChoice(choice)}
                >
                    <span className="flex flex-col">
                        <span className="font-bold text-[24px] break-all">{tag.name}</span>
                        <span className="italic text-[14px] leading-0 my-2">{getCategoryName(tag.category)}</span>
                    </span>

                    <div className="flex flex-col mb-[0px]">
                        <span className="relative h-[200px] md:h-[300px] md:mb-[12px] mb-[6px] rounded-md overflow-hidden">
                            <ImageCard tag={tag} ratingLevel={ratingLevel} />
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
                </button>
            </div>
            <span className="flex flex-row gap-2 items-center justify-center pt-3">
                <button
                    type="button"
                    className={`${buttonClasses} p-2 disabled:opacity-50 disabled:pointer-events-none`}
                    title="View on e621"
                    onClick={() => {
                        if (sourceLink) {
                            window.open(sourceLink, "_blank");
                        }
                    }}
                    disabled={!sourceLink}
                >
                    🔗
                </button>
                <span>Score: {tag.images[ratingLevel.toLowerCase() as keyof ImagePreviews]?.score || "--"}</span>
                <button
                    type="button"
                    title="View bigger image"
                    className={`${buttonClasses} p-2 disabled:opacity-50 disabled:pointer-events-none`}
                    disabled={!sourceLink}
                >
                    🔎
                </button>
            </span>
        </div>
    );
}
