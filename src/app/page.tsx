"use client";
import { useState, useEffect } from "react";
import { Tag } from "./interfaces";
import TagDisplay from "./components/TagDisplay";

function getRandomTag(tags: Tag[]): Tag | null {
    if (tags.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * tags.length);
    return tags[randomIndex];
}

export default function Home() {
    const [allTags, setAllTags] = useState<Tag[]>([]);

    const [leftTag, setLeftTag] = useState<Tag | null>(null);
    const [rightTag, setRightTag] = useState<Tag | null>(null);

    const [isRevealed, setIsRevealed] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [choice, setChoice] = useState<"higher" | "lower" | null>(null);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
        fetch("/api/numbers")
            .then((res) => res.json())
            .then((tags: Tag[]) => {
                setAllTags(tags);
                setLeftTag(getRandomTag(tags));
                setRightTag(getRandomTag(tags));
            })
            .catch((error) => console.error("Failed to fetch tags:", error));
    }, []);

    const handleChoice = (selectedChoice: "higher" | "lower") => {
        if (isRevealed || !leftTag || !rightTag) return;

        setChoice(selectedChoice);

        const correctChoice = rightTag.count >= leftTag.count ? "higher" : "lower";
        const wasCorrect = selectedChoice === correctChoice;

        setIsCorrect(wasCorrect);

        if (wasCorrect) {
            setCurrentStreak((prev) => prev + 1);
            if (currentStreak + 1 > bestStreak) {
                setBestStreak(currentStreak + 1);
            }

            setTimeout(() => {
                setLeftTag(rightTag);
                setRightTag(getRandomTag(allTags));
                setIsRevealed(false);
                setChoice(null);
                setIsCorrect(false);
            }, 4000);
        } else {
            setCurrentStreak(0);
            // After a delay, get two new tags
            setTimeout(() => {
                setLeftTag(getRandomTag(allTags));
                setRightTag(getRandomTag(allTags));
                setIsRevealed(false);
                setChoice(null);
            }, 2000);
        }

        setIsRevealed(true);
    };

    const getBorderColor = (buttonChoice: "higher" | "lower") => {
        if (!isRevealed || !leftTag || !rightTag) return "border-gray-600 border-[1px]";
        const correctChoice = rightTag.count >= leftTag.count ? "higher" : "lower";
        const isButtonCorrect = buttonChoice === correctChoice;

        if (choice === buttonChoice) {
            return isButtonCorrect ? "border-green-500 border-1" : "border-red-500 border-1";
        } else {
            return isButtonCorrect ? "border-red-500 border-1" : "border-green-500 border-1";
        }
    };

    if (!leftTag || !rightTag) {
        return <div className="flex items-center justify-center min-h-screen">Loading tags...</div>;
    }

    const getCategoryName = (category: number) => {
        switch (category) {
            case 0:
                return "general tag";
            case 1:
                return "artist";
            case 2:
                return "contributor";
            case 3:
                return "copyright tag";
            case 4:
                return "character";
            case 5:
                return "species";
            case 6:
                return "invalid tag";
            case 7:
                return "meta";
            case 8:
                return "lore tag";
            default:
                return "unknown";
        }
    };

    return (
        <div
            id="container"
            className="font-sans items-center justify-items-center min-h-screen h-full max-w-[1200px] mx-auto w-screen p-8 pb-20"
        >
            <header className="flex flex-col gap-[16px] justify-center text-center border-1 rounded-xl p-[16px] w-full bg-[#4a5568ab] shadow-xl">
                <h2 className="text-[48px] font-bold">e621dle</h2>
                <span className="flex flex-row justify-center gap-[12px]">
                    <span className="p-2 border-1 rounded-xl">Current Streak: {currentStreak}</span>
                    <span className="p-2 border-1 rounded-xl">Best Streak: {bestStreak}</span>
                </span>
            </header>
            <div
                className={`my-[20px] text-center text-[36px] font-bold ${
                    isCorrect === false && isRevealed
                        ? "text-red-500 drop-shadow-2xl animate-wiggle"
                        : isCorrect
                        ? "text-green-500 drop-shadow-2xl animate-bounce"
                        : ""
                }`}
            >
                {isCorrect === false && isRevealed
                    ? "Incorrect!"
                    : isCorrect
                    ? "Correct!"
                    : "Which tag has more posts?"}
            </div>
            <main className="flex flex-col text-center gap-[12px] my-[20px] min-h-[500px] w-full items-stretch rounded-xl">
                <div
                    className={`flex flex-row gap-[16px] h-full w-full row-start-2 items-center sm:items-start rounded-xl ${
                        isCorrect ? "animate-shake" : "animate-fade-in-up"
                    }`}
                >
                    <TagDisplay
                        tag={leftTag}
                        isRevealed={isRevealed}
                        handleChoice={handleChoice}
                        choice="lower"
                        getBorderColor={getBorderColor}
                        getCategoryName={getCategoryName}
                    />
                    <div className="text-3xl font-bold my-auto px-[10px]">or</div>
                    <TagDisplay
                        tag={rightTag}
                        isRevealed={isRevealed}
                        handleChoice={handleChoice}
                        choice="higher"
                        getBorderColor={getBorderColor}
                        getCategoryName={getCategoryName}
                    />
                </div>
            </main>
            <footer className="row-start-3 flex flex-col flex-wrap items-center justify-center bg-[#4a5568ab] bottom-[24px] border-1 rounded-xl shadow-xl w-full py-[12px]">
                <span>Created by Team Starfall</span>
                <span>
                    Inspired by{" "}
                    <a className="underline" href="https://rule34dle.vercel.app/">
                        Rule34dle
                    </a>
                </span>
            </footer>
        </div>
    );
}
