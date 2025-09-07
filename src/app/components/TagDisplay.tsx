
import { Tag } from "../interfaces";

interface TagDisplayProps {
    tag: Tag | null;
    isRevealed: boolean;
    handleChoice: (choice: "higher" | "lower") => void;
    choice: "higher" | "lower";
    getBorderColor: (choice: "higher" | "lower") => string;
    getCategoryName: (category: number) => string;
}

export default function TagDisplay({ tag, isRevealed, handleChoice, choice, getBorderColor, getCategoryName }: TagDisplayProps) {
    if (!tag) {
        return null;
    }

    return (
        <div
            className={`flex flex-col grow gap-[12px] w-full h-full p-6 bg-[#071e32] border-4 hover:bg-gray-600 rounded-xl shadow-2xl ${
                isRevealed ? "cursor-not-allowed" : "cursor-pointer"
            } ${getBorderColor(choice)}`}
            onClick={() => handleChoice(choice)}
        >
            <span className="flex flex-col">
                <span className="font-bold text-[24px]">{tag.name}</span>
                <span className="italic text-[14px]">{getCategoryName(tag.category)}</span>
            </span>

            <div className="flex flex-col mb-[0px]">
                <span className="min-h-[100px] max-h-[250px] h-[500px] my-[12px] bg-gray-500 rounded-md">
                    image coming soon :)
                </span>
                <span className="text-[42px] font-bold leading-none">
                    {isRevealed ? tag.count.toLocaleString() : (choice === "lower" ? tag.count.toLocaleString() : "?")}
                </span>
                <span>posts</span>
            </div>
        </div>
    );
}
