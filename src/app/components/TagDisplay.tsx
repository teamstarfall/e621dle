import { Tag } from "../interfaces";
import ImageCard from "./ImageCard";

interface TagDisplayProps {
    tag: Tag | null;
    isRevealed: boolean;
    handleChoice: (choice: "higher" | "lower") => void;
    choice: "higher" | "lower";
    getCategoryName: (category: number) => string;
    animatedCount?: number;
}

export default function TagDisplay({
    tag,
    isRevealed,
    handleChoice,
    choice,
    getCategoryName,
    animatedCount,
}: TagDisplayProps) {
    if (!tag) {
        return null;
    }

    const displayCount = () => {
        if (choice === "lower") {
            return tag.count.toLocaleString();
        }
        if (isRevealed) {
            return animatedCount?.toLocaleString() ?? "?";
        }
        return "?";
    };

    return (
        <div
            className={`flex flex-col grow gap-[12px] w-full h-full p-6 mx-[20px] bg-[#071e32] border-1 border-gray-600 rounded-xl shadow-md ${
                isRevealed ? "cursor-not-allowed" : "cursor-pointer"
            } hover:border-white hover:shadow-xl hover:shadow-white hover:-translate-y-2 transition-all`}
            onClick={() => handleChoice(choice)}
        >
            <span className="flex flex-col">
                <span className="font-bold text-[24px]">{tag.name}</span>
                <span className="italic text-[14px]">{getCategoryName(tag.category)}</span>
            </span>

            <div className="flex flex-col mb-[0px]">
                <span className="relative h-[300px] my-[12px] rounded-md overflow-hidden">
                    <ImageCard tag={tag} />
                </span>
                <span className="text-[42px] font-bold leading-none">{displayCount()}</span>
                <span>posts</span>
            </div>
        </div>
    );
}
