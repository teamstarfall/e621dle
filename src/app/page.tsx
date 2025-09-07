"use client";
import { useState, useEffect } from "react";
import { Tag } from "./interfaces";
import TagDisplay from "./components/TagDisplay";
import { INCREMENT_ANIM_MS, SHOW_ANSWER_TIME_MS } from "./constants";

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
    const [animatedCount, setAnimatedCount] = useState(0);

    useEffect(() => {
        fetch("/api/numbers")
            .then((res) => res.json())
            .then((tags: Tag[]) => {
                setAllTags(tags);
                const newLeftTag = getRandomTag(tags);
                const newRightTag = getRandomTag(tags);
                setLeftTag(newLeftTag);
                setRightTag(newRightTag);
                if (newLeftTag) {
                    setAnimatedCount(0);
                }
            })
            .catch((error) => console.error("Failed to fetch tags:", error));
    }, []);

    useEffect(() => {
        if (isRevealed && leftTag && rightTag) {
            const start = 0;
            const end = rightTag.count;
            const range = end - start;
            let startTime: number | null = null;

            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime;
                const elapsedTime = currentTime - startTime;
                let progress = Math.min(elapsedTime / INCREMENT_ANIM_MS, 1);
                // Apply ease-out cubic easing function
                progress = 1 - Math.pow(1 - progress, 3);
                const currentCount = Math.floor(start + range * progress);
                setAnimatedCount(currentCount);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }
    }, [isRevealed, leftTag, rightTag]);

    const handleChoice = (selectedChoice: "higher" | "lower") => {
        if (isRevealed || !leftTag || !rightTag) return;

        const wasCorrect =
            (selectedChoice === "higher" && rightTag.count >= leftTag.count) ||
            (selectedChoice === "lower" && rightTag.count <= leftTag.count);

        if (wasCorrect) {
            setCurrentStreak((prev) => prev + 1);
            if (currentStreak + 1 > bestStreak) {
                setBestStreak(currentStreak + 1);
            }

            setTimeout(() => {
                setLeftTag(rightTag);
                const newRightTag = getRandomTag(allTags);
                setRightTag(newRightTag);
                if (rightTag) {
                    setAnimatedCount(0);
                }
                setIsRevealed(false);
            }, SHOW_ANSWER_TIME_MS);
        } else {
            setCurrentStreak(0);
            setTimeout(() => {
                const newLeftTag = getRandomTag(allTags);
                const newRightTag = getRandomTag(allTags);
                setLeftTag(newLeftTag);
                setRightTag(newRightTag);
                if (newLeftTag) {
                    setAnimatedCount(0);
                }
                setIsRevealed(false);
            }, SHOW_ANSWER_TIME_MS);
        }

        setIsRevealed(true);
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

            <div className={`text-center text-[36px] font-bold py-[20px]`}>Which tag has more posts?</div>
            <main className="flex flex-col text-center gap-[12px] min-h-[500px] w-full items-stretch rounded-xl">
                <div
                    className={`flex flex-row gap-[16px] h-full w-full row-start-2 items-center sm:items-start rounded-xl animate-fade-in-up`}
                >
                    <TagDisplay
                        tag={leftTag}
                        isRevealed={isRevealed}
                        handleChoice={handleChoice}
                        choice="lower"
                        getCategoryName={getCategoryName}
                    />
                    <div className="text-3xl font-bold my-auto px-[30px]">or</div>
                    <TagDisplay
                        tag={rightTag}
                        isRevealed={isRevealed}
                        handleChoice={handleChoice}
                        choice="higher"
                        getCategoryName={getCategoryName}
                        animatedCount={animatedCount}
                    />
                </div>
            </main>
            <footer className="row-start-3 flex flex-col flex-wrap items-center justify-center bg-[#4a5568ab] bottom-[24px] border-1 rounded-xl shadow-xl w-full py-[12px]">
                <span>Created by Team Starfall (angelolz/azuretst)</span>
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
