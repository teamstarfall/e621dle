import { TagCardProps as TagCardProps, ImagePreviews } from "../interfaces";
import { useEffect, useMemo, useState } from "react";
import ImageCard from "./ImageCard";
import ImageViewer from "./ImageViewer";
import AnimatedNumber from "./AnimatedCount";

const buttonClasses =
    "bg-[#071e32] border-gray-300 rounded-xl shadow-xl ring ring-gray-500 hover:border-white hover:ring-4 hover:ring-white hover:bg-[#2e5999] transition-all";
export default function TagCard({
    tag,
    isRevealed,
    handleChoice,
    choice,
    getCategoryName,
    ratingLevel,
    gameMode,
}: TagCardProps) {
    const [showImageViewer, setShowImageViewer] = useState(false);
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

    const sources = useMemo(() => {
        if (ratingLevel === "No Images") {
            return [];
        }

        const potential = [];
        const ratingsToShow: (keyof ImagePreviews)[] = [];

        if (ratingLevel === "Safe") {
            ratingsToShow.push("safe");
        } else if (ratingLevel === "Questionable") {
            ratingsToShow.push("questionable", "safe");
        } else if (ratingLevel === "Explicit") {
            ratingsToShow.push("explicit", "questionable", "safe");
        }

        for (const rating of ratingsToShow) {
            const md5 = tag?.images[rating]?.md5;
            const fileExt = tag?.images[rating]?.fileExt;
            const score = tag?.images[rating]?.score;

            if (md5) {
                potential.push({
                    url: `https://static1.e621.net/data/sample/${md5.substring(0, 2)}/${md5.substring(2, 4)}/${md5}.jpg`,
                    score: score,
                });
                potential.push({
                    url: `https://static1.e621.net/data/${md5.substring(0, 2)}/${md5.substring(2, 4)}/${md5}.${fileExt}`,
                    score: score,
                });
            }
        }
        return potential;
    }, [tag, ratingLevel]);

    useEffect(() => {
        setSourceIndex(0);
    }, [sources]);

    const handleError = () => {
        setSourceIndex((prevIndex) => prevIndex + 1);
    };

    const [sourceIndex, setSourceIndex] = useState(0);
    const currentSrc = sources[sourceIndex];

    if (!tag) {
        return null;
    }

    return (
        <div className="w-full">
            <div className="group flex flex-col grow">
                <div
                    className={`flex flex-col gap-[12px] w-full h-full p-1 md:p-6 group-hover:-translate-y-2 ${buttonClasses}`}
                >
                    <button
                        type="button"
                        className="flex flex-col"
                        onClick={() => handleChoice(choice)}
                        disabled={isRevealed}
                    >
                        <span className="font-bold text-[24px] break-all">{tag.name}</span>
                        <span className="italic text-[14px] mb-2">{getCategoryName(tag.category)}</span>
                        <div className="flex flex-col mb-[0px]">
                            <span className="relative h-[200px] md:h-[300px] md:mb-[12px] mb-[6px] rounded-md overflow-hidden">
                                <ImageCard currentSrc={currentSrc} handleError={handleError} tagName={tag.name} />
                            </span>
                        </div>
                        {gameMode === "Endless" && choice === "left" ? (
                            <span className="text-[32px] md:text-[42px] font-bold leading-none">
                                {tag.count.toLocaleString()}
                            </span>
                        ) : (
                            <AnimatedNumber isRevealed={isRevealed} tag={tag} />
                        )}
                        <span>posts</span>
                    </button>
                </div>
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
                    onClick={() => setShowImageViewer(true)}
                >
                    🔎
                </button>
            </span>
            <ImageViewer
                isRevealed={showImageViewer}
                onClose={() => setShowImageViewer(false)}
                imageUrl={sources[sourceIndex]?.url}
                tagName={tag.name}
            />
        </div>
    );
}
