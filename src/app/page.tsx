"use client";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { RatingLevel, Tag, TagResponse } from "./interfaces";
import TagDisplay from "./components/TagDisplay";
import {
    BEST_STREAK,
    INCREMENT_ANIM_MS,
    SETTINGS_ADULT_WARNING,
    SETTINGS_CHARACTER_TAGS_ONLY,
    SETTINGS_RATING_LEVEL,
    SHOW_ANSWER_TIME_MS,
} from "./constants";
import Modal from "./components/Modal";
import Settings from "./components/Settings";

function getRandomTag(tags: Tag[]): Tag | null {
    if (tags.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * tags.length);
    return tags[randomIndex];
}

export default function Home() {
    const [showAdultWarning, setShowAdultWarning] = useState(true);

    //game states
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [leftTag, setLeftTag] = useState<Tag | null>(null);
    const [rightTag, setRightTag] = useState<Tag | null>(null);
    const [date, setDate] = useState<string | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [animatedCount, setAnimatedCount] = useState(0);
    const [showCharactersOnly, setShowCharactersOnly] = useState(false);

    //settings
    const [ratingLevel, setRatingLevel] = useState<RatingLevel>("Safe");
    const [characterTagsOnly, setCharacterTagsOnly] = useState(false);

    const filteredTags = useMemo(() => {
        if (showCharactersOnly) {
            return allTags.filter((tag) => tag.category === 4);
        }
        return allTags;
    }, [allTags, showCharactersOnly]);

    useEffect(() => {
        //get options
        const savedRatingLevel = localStorage.getItem(SETTINGS_RATING_LEVEL) as RatingLevel;
        if (savedRatingLevel) {
            setRatingLevel(savedRatingLevel);
        }

        const characterTagsSetting = localStorage.getItem(SETTINGS_CHARACTER_TAGS_ONLY);
        if (characterTagsSetting === "true") {
            setCharacterTagsOnly(true);
            setShowCharactersOnly(true);
        }

        const adultWarning = localStorage.getItem(SETTINGS_ADULT_WARNING);
        if (adultWarning) {
            setShowAdultWarning(false);
        }

        //get best score
        const bestStreak = localStorage.getItem(BEST_STREAK);
        if (bestStreak && !isNaN(parseInt(bestStreak))) {
            setBestStreak(parseInt(bestStreak));
        }

        //load posts
        fetch("/api/posts")
            .then((res) => res.json())
            .then((tagsResponse: TagResponse) => {
                setDate(tagsResponse.date);
                const filteredTags =
                    characterTagsSetting === "true"
                        ? tagsResponse.tags.filter((tag) => tag.category === 4)
                        : tagsResponse.tags;
                setAllTags(tagsResponse.tags);
                const newLeftTag = getRandomTag(filteredTags);
                let newRightTag = getRandomTag(filteredTags);

                if (filteredTags.length > 1) {
                    while (newLeftTag && newRightTag && newRightTag.name === newLeftTag.name) {
                        newRightTag = getRandomTag(filteredTags);
                    }
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

        setAnimatedCount(0);

        const wasCorrect =
            (selectedChoice === "higher" && rightTag.count >= leftTag.count) ||
            (selectedChoice === "lower" && rightTag.count <= leftTag.count);

        if (wasCorrect) {
            setTimeout(() => {
                setCurrentStreak((prev) => prev + 1);
                if (currentStreak + 1 > bestStreak) {
                    setBestStreak(currentStreak + 1);
                    localStorage.setItem(BEST_STREAK, (currentStreak + 1).toString());
                }

                setLeftTag(rightTag);
                const newRightTag = getRandomTag(filteredTags);
                setRightTag(newRightTag);
                if (rightTag) {
                    setAnimatedCount(0);
                }
                setIsRevealed(false);
            }, SHOW_ANSWER_TIME_MS);
        } else {
            setTimeout(() => {
                setShowGameOverModal(true);
            }, SHOW_ANSWER_TIME_MS);
        }
        setIsRevealed(true);
    };

    const handleAdultWarning = (selectedChoice: boolean) => {
        if (selectedChoice) {
            setShowAdultWarning(false);
            localStorage.setItem(SETTINGS_ADULT_WARNING, "true");
        } else {
            window.location.href = "https://google.com";
        }
    };

    const restartRound = () => {
        setShowCharactersOnly(characterTagsOnly);
        setCurrentStreak(0);
        setShowGameOverModal(false);
        setIsRevealed(false);

        const currentFilteredTags = characterTagsOnly ? allTags.filter((tag) => tag.category === 4) : allTags;
        const newLeftTag = getRandomTag(currentFilteredTags);
        let newRightTag = getRandomTag(currentFilteredTags);

        if (currentFilteredTags.length > 1) {
            while (newLeftTag && newRightTag && newRightTag.name === newLeftTag.name) {
                newRightTag = getRandomTag(currentFilteredTags);
            }
        }
        setLeftTag(newLeftTag);
        setRightTag(newRightTag);
    };

    const toggleCharacters = (value: boolean) => {
        setCharacterTagsOnly(value);
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

    if (showAdultWarning) {
        return (
            <div className={`text-center text-2xl md:text-4xl py-5`}>
                <Modal isRevealed={showAdultWarning} onClose={() => setShowGameOverModal(false)}>
                    <h2 className="pb-2 text-3xl font-bold">Adult Content Ahead!</h2>
                    <h1 className="text-lg">
                        You must be <b>18 years or older</b> to access this website.
                    </h1>
                    <span className="flex flex-col">
                        <button
                            onClick={() => handleAdultWarning(true)}
                            className="mt-4 px-4 py-2 bg-[#6a0000]  hover:bg-[#f80000] text-white rounded-lg text-lg transition-all ring hover:ring-3 border-gray-300 shadow-xl"
                        >
                            Yes, I am 18 and older
                        </button>
                        <button
                            onClick={() => handleAdultWarning(false)}
                            className="mt-4 px-4 py-2 bg-[#073f12]  hover:bg-[#0e7f27] text-white rounded-lg text-lg transition-all ring hover:ring-3 border-gray-300 shadow-xl"
                        >
                            No, I am out!
                        </button>
                    </span>
                </Modal>
            </div>
        );
    }

    return (
        <div
            id="container"
            className="font-sans items-center justify-items-center min-h-screen h-full max-w-[1200px] mx-auto w-screen p-4 md:p-8 pb-20"
        >
            <header className="relative flex flex-col items-center border-1 rounded-xl p-4 w-full bg-[#1f3c67] shadow-xl">
                <div className="flex flex-col items-center">
                    <Image src="/logo.png" alt="e621dle logo" width={200} height={64} />
                    <div className="flex items-center px-4 py-2 border-1 rounded-full bg-[#071e32] mt-4">
                        <span>Current: {currentStreak}</span>
                        <div className="h-4 w-px bg-gray-400 mx-2"></div>
                        <span>Best: {bestStreak}</span>
                    </div>
                </div>
                <Settings
                    ratingLevel={ratingLevel}
                    setRatingLevel={setRatingLevel}
                    characterTagsOnly={characterTagsOnly}
                    toggleCharacters={toggleCharacters}
                />
            </header>

            <div className={`text-center text-2xl md:text-4xl py-5`}>
                <span className="hidden sm:inline font-bold">Which tag has more posts?</span>
                <Modal isRevealed={showGameOverModal} onClose={() => setShowGameOverModal(false)}>
                    <h2 className="pb-2 text-3xl font-bold">Game Over!</h2>
                    <h1 className="text-lg">You guessed incorrectly!</h1>
                    <button
                        onClick={() => restartRound()}
                        className="font-bold mt-4 px-4 py-2 bg-[#071e32]  hover:bg-[#014995] text-white rounded-lg text-lg transition-colors border-1 border-gray-300 shadow-xl"
                    >
                        Play Again
                    </button>
                </Modal>
            </div>

            <main className="flex flex-col text-center gap-4 w-full items-stretch rounded-xl">
                <div className={`flex flex-col sm:flex-row gap-4 h-full w-full items-center rounded-xl`}>
                    {!leftTag || !rightTag ? (
                        <div className="flex items-center justify-center text-center mx-auto">Loading tags...</div>
                    ) : (
                        <>
                            <TagDisplay
                                tag={leftTag}
                                isRevealed={isRevealed}
                                handleChoice={handleChoice}
                                choice="lower"
                                getCategoryName={getCategoryName}
                                ratingLevel={ratingLevel}
                            />
                            <div className="font-bold mx-auto sm:my-auto sm:px-4">
                                <span className="text-3xl hidden sm:inline py-4">or</span>
                                <span className="inline sm:hidden text-lg">Which tag has more posts?</span>
                            </div>
                            <TagDisplay
                                tag={rightTag}
                                isRevealed={isRevealed}
                                handleChoice={handleChoice}
                                choice="higher"
                                getCategoryName={getCategoryName}
                                animatedCount={animatedCount}
                                ratingLevel={ratingLevel}
                            />
                        </>
                    )}
                </div>
            </main>
            <footer className="flex flex-col flex-wrap items-center justify-center bg-[#1f3c67] bottom-6 border-1 rounded-xl shadow-xl w-full py-3 mt-8">
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
