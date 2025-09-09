"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Ratings, Tag, TagResponse } from "./interfaces";
import TagDisplay from "./components/TagDisplay";
import { INCREMENT_ANIM_MS, SHOW_ANSWER_TIME_MS } from "./constants";

function getRandomTag(tags: Tag[]): Tag | null {
    if (tags.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * tags.length);
    return tags[randomIndex];
}

export default function Home() {
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [date, setDate] = useState<string | null>(null);
    const [leftTag, setLeftTag] = useState<Tag | null>(null);
    const [rightTag, setRightTag] = useState<Tag | null>(null);

    const [isRevealed, setIsRevealed] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [animatedCount, setAnimatedCount] = useState(0);

    const defaultRatings: Ratings = {
        explicit: false,
        questionable: false,
        safe: true,
    };
    const [selectedRatings, setSelectedRatings] = useState<Ratings>(defaultRatings);

    useEffect(() => {
        //get options
        const selectedRatings = localStorage.getItem("selectedRatings");
        if (selectedRatings) {
            setSelectedRatings(JSON.parse(selectedRatings));
        }

        //load posts
        fetch("/api/posts")
            .then((res) => res.json())
            .then((tagsResponse: TagResponse) => {
                setDate(tagsResponse.date);
                setAllTags(tagsResponse.tags);
                const newLeftTag = getRandomTag(tagsResponse.tags);
                let newRightTag = getRandomTag(tagsResponse.tags);

                while (newLeftTag && newRightTag && newRightTag.name === newLeftTag.name) {
                    newRightTag = getRandomTag(tagsResponse.tags);
                }

                setLeftTag(newLeftTag);
                setRightTag(newRightTag);

                if (newLeftTag) {
                    setAnimatedCount(0);
                }
            })
            .catch((error) => console.error("Failed to fetch tags:", error));
    }, []);

    useEffect(() => {
        localStorage.setItem("selectedRatings", JSON.stringify(selectedRatings));
    }, [selectedRatings]);

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
            setTimeout(() => {
                setCurrentStreak((prev) => prev + 1);
                if (currentStreak + 1 > bestStreak) {
                    setBestStreak(currentStreak + 1);
                }

                setLeftTag(rightTag);
                const newRightTag = getRandomTag(allTags);
                setRightTag(newRightTag);
                if (rightTag) {
                    setAnimatedCount(0);
                }
                setIsRevealed(false);
            }, SHOW_ANSWER_TIME_MS);
        } else {
            setTimeout(() => {
                setIsGameOver(true);
            }, SHOW_ANSWER_TIME_MS);
        }

        setIsRevealed(true);
    };

    const handleTryAgain = () => {
        setIsGameOver(false);
        setCurrentStreak(0);
        const newLeftTag = getRandomTag(allTags);
        let newRightTag = getRandomTag(allTags);
        while (newLeftTag && newRightTag && newRightTag.name === newLeftTag.name) {
            newRightTag = getRandomTag(allTags);
        }
        setLeftTag(newLeftTag);
        setRightTag(newRightTag);
        if (newLeftTag) {
            setAnimatedCount(0);
        }
        setIsRevealed(false);
    };

    const handleRatingChange = (rating: keyof typeof selectedRatings) => {
        setSelectedRatings((prev) => ({
            ...prev,
            [rating]: !prev[rating],
        }));
    };

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
            className="font-sans items-center justify-items-center min-h-screen h-full max-w-[1200px] mx-auto w-screen p-4 md:p-8 pb-20"
        >
            <header className="relative flex flex-col items-center border-1 rounded-xl p-4 w-full bg-[#1f3c67] shadow-xl">
                <div className="flex flex-col items-center">
                    <Image src="/logo.png" alt="e621dle logo" width={200} height={64} />
                    <span className="flex flex-row gap-4 mt-2">
                        <span className="p-2 border-1 rounded-xl bg-[#014995]">Current Streak: {currentStreak}</span>
                        <span className="p-2 border-1 rounded-xl bg-[#014995]">Best Streak: {bestStreak}</span>
                    </span>
                </div>
                <div className="flex flex-col mt-4 md:absolute md:top-4 md:right-4 md:mt-0">
                    <a className="text-center md:text-left md:pr-[12px]">Include Ratings: </a>
                    <div className="flex flex-row gap-[2px] md:flex-col">
                        <label className="flex gap-1">
                            <input
                                type="checkbox"
                                checked={selectedRatings.explicit}
                                onChange={() => handleRatingChange("explicit")}
                            />
                            Explicit
                        </label>
                        <label className="flex gap-1 px-3 md:px-0">
                            <input
                                type="checkbox"
                                checked={selectedRatings.questionable}
                                onChange={() => handleRatingChange("questionable")}
                            />
                            Questionable
                        </label>
                        <label className="flex gap-1">
                            <input
                                type="checkbox"
                                checked={selectedRatings.safe}
                                onChange={() => handleRatingChange("safe")}
                            />
                            Safe
                        </label>
                    </div>
                </div>
            </header>

            <div className={`text-center text-2xl md:text-4xl font-bold py-5`}>
                {isGameOver ? (
                    <>
                        <h2>Game Over!</h2>
                        <button
                            onClick={handleTryAgain}
                            className="bg-[#014995] hover:bg-blue-500 text-white font-bold py-2 px-4 rounded mt-2 text-lg"
                        >
                            Play Again
                        </button>
                    </>
                ) : (
                    "Which tag has more posts?"
                )}
            </div>
            <main className="flex flex-col text-center gap-4 w-full items-stretch rounded-xl">
                <div className={`flex flex-col sm:flex-row gap-4 h-full w-full items-center rounded-xl`}>
                    {!leftTag || !rightTag ? (
                        <div className="flex items-center justify-center min-h-screen">Loading tags...</div>
                    ) : (
                        <>
                            <TagDisplay
                                tag={leftTag}
                                isRevealed={isRevealed}
                                handleChoice={handleChoice}
                                choice="lower"
                                getCategoryName={getCategoryName}
                                ratings={selectedRatings}
                            />
                            <div className="text-3xl font-bold mx-auto sm:my-auto sm:px-4">or</div>
                            <TagDisplay
                                tag={rightTag}
                                isRevealed={isRevealed}
                                handleChoice={handleChoice}
                                choice="higher"
                                getCategoryName={getCategoryName}
                                animatedCount={animatedCount}
                                ratings={selectedRatings}
                            />
                        </>
                    )}
                </div>
            </main>
            <footer className="flex flex-col flex-wrap items-center justify-center bg-[#1f3c67] bottom-6 border-1 rounded-xl shadow-xl w-full py-3 mt-6">
                <span>Created by Team Starfall (angelolz/azuretst)</span>
                <span>
                    Inspired by{" "}
                    <a className="underline" href="https://rule34dle.vercel.app/">
                        Rule34dle
                    </a>
                </span>
                {date && <span>Data is based on {date}.</span>}
            </footer>
        </div>
    );
}
