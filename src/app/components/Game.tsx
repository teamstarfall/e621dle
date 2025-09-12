"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, use } from "react";
import { Tag, GameProps } from "../interfaces";
import TagCard from "./TagCard";
import { BEST_STREAK, INCREMENT_ANIM_MS, SHOW_ANSWER_TIME_MS } from "../constants";
import Modal from "../components/Modal";
import Settings from "../components/Settings";
import { useLocalStorage, useSettings } from "../storage";

function getRandomTag(tags: Tag[]): Tag | null {
    if (tags.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * tags.length);
    return tags[randomIndex];
}

function getCategoryName(category: number) {
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
}

export default function Game({ posts }: GameProps) {
    const { tags, date } = use(posts);
    const [bestStreak, setBestStreak] = useLocalStorage<number>(BEST_STREAK, 0);

    // settings
    const { ratingLevel, characterTagsOnly, showAdultWarning, setShowAdultWarning, pause } = useSettings();

    const [showCharactersOnly, setShowCharactersOnly] = useState(characterTagsOnly);

    const filteredTags = useMemo(() => {
        if (showCharactersOnly) {
            return tags.filter((tag) => tag.category === 4);
        }
        return tags;
    }, [tags, showCharactersOnly]);

    //game states
    const [leftTag, setLeftTag] = useState<Tag | null>(null);
    const [rightTag, setRightTag] = useState<Tag | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [showContinue, setShowContinue] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [animatedCount, setAnimatedCount] = useState(0);
    const [gameMode, setGameMode] = useState<"Daily" | "Endless">("Daily");

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

    useEffect(() => {
        if (showCharactersOnly === null) {
            setShowCharactersOnly(characterTagsOnly);
            return;
        }

        if (leftTag === null || rightTag === null) {
            setLeftTag(getRandomTag(filteredTags));
            setRightTag(getRandomTag(filteredTags));
        }
    }, [characterTagsOnly, filteredTags, leftTag, rightTag, showCharactersOnly]);

    function continueGame() {
        setCurrentStreak((prev) => prev + 1);
        if (currentStreak + 1 > (bestStreak ?? 0)) {
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
        setShowContinue(false);
    }

    const handleChoice = (selectedChoice: "higher" | "lower") => {
        if (isRevealed || !leftTag || !rightTag) return;

        setAnimatedCount(0);

        const wasCorrect =
            (selectedChoice === "higher" && rightTag.count >= leftTag.count) ||
            (selectedChoice === "lower" && rightTag.count <= leftTag.count);

        if (wasCorrect) {
            setTimeout(() => {
                if (pause) {
                    setShowContinue(true);
                } else {
                    continueGame();
                }
            }, SHOW_ANSWER_TIME_MS);
        } else {
            setTimeout(() => {
                setShowGameOverModal(true);
            }, SHOW_ANSWER_TIME_MS);
        }
        setIsRevealed(true);
    };

    const restartRound = () => {
        setShowCharactersOnly(characterTagsOnly);
        setCurrentStreak(0);
        setShowGameOverModal(false);
        setIsRevealed(false);

        const currentFilteredTags = characterTagsOnly ? tags.filter((tag) => tag.category === 4) : tags;
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

    const handleAdultWarning = (selectedChoice: boolean) => {
        if (selectedChoice) {
            setShowAdultWarning(false);
        } else {
            window.location.href = "https://google.com";
        }
    };

    if (showAdultWarning) {
        return (
            <Modal isRevealed={showAdultWarning} onClose={() => void 0}>
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
        );
    }

    return (
        <div id="container" className="font-sans items-center flex flex-col min-h-screen max-w-[1200px] mx-auto w-full">
            <header className="grid grid-cols-[1fr_auto_1fr] items-center mt-8 w-full">
                <div className="justify-self-start flex flex-col items-center">
                    <Image src="/logo.png" alt="e621dle logo" width={256} height={81} className="w-25 md:w-50 h-auto" />
                    <div className="flex rounded-lg shadow-sm mt-2" role="group">
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-l-lg hover:bg-gray-600 focus:z-10 focus:ring-2 focus:ring-gray-500 ${
                                gameMode === "Endless" ? "bg-gray-900" : ""
                            }`}
                            onClick={() => setGameMode("Endless")}
                        >
                            Endless
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-r-lg hover:bg-gray-600 focus:z-10 focus:ring-2 focus:ring-gray-500 ${
                                gameMode === "Daily" ? "bg-gray-900" : ""
                            }`}
                            onClick={() => setGameMode("Daily")}
                        >
                            Daily
                        </button>
                    </div>
                </div>
                <div className="justify-self-center flex flex-col items-center">
                    <div className={`text-center text-2xl md:text-3xl pb-4`}>
                        <span className="hidden sm:inline font-bold">Which tag has more posts?</span>
                    </div>
                    <div className="flex flex-row items-center px-4 py-2 border-1 rounded-xl bg-[#071e32] justify-items-center">
                        <span className="flex flex-row text-center justify-center items-center">
                            <span className="font-bold whitespace-nowrap">Current</span>
                            <span className="font-bold text-[32px] mx-2">{currentStreak}</span>
                        </span>
                        <div className="h-8 w-px bg-gray-400 mx-2" />
                        <span className="flex flex-row text-center justify-center items-center">
                            <span className="font-bold whitespace-nowrap">Best</span>
                            <span className="font-bold text-[32px] mx-2">{bestStreak}</span>
                        </span>
                    </div>
                </div>
                <div className="justify-self-end">
                    <Settings />
                </div>
            </header>

            <main className="flex flex-col text-center gap-4 w-full rounded-xl my-12">
                <div
                    className={`flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] gap-4 h-full w-full items-center rounded-xl`}
                >
                    {!leftTag || !rightTag ? (
                        <div className="flex items-center justify-center text-center mx-auto">Loading tags...</div>
                    ) : (
                        <>
                            <TagCard
                                tag={leftTag}
                                isRevealed={isRevealed}
                                handleChoice={handleChoice}
                                choice="lower"
                                getCategoryName={getCategoryName}
                                ratingLevel={ratingLevel ?? "Safe"}
                            />
                            <div className="font-bold sm:my-auto sm:px-4 justify-self-center">
                                <span className="text-3xl hidden sm:inline py-4">or</span>
                                <span className="inline sm:hidden text-lg">Which tag has more posts?</span>
                            </div>
                            <TagCard
                                tag={rightTag}
                                isRevealed={isRevealed}
                                handleChoice={handleChoice}
                                choice="higher"
                                getCategoryName={getCategoryName}
                                animatedCount={animatedCount}
                                ratingLevel={ratingLevel ?? "Safe"}
                            />
                        </>
                    )}
                </div>
            </main>

            {pause && (
                <div className="flex flex-row gap-4 w-full items-center justify-center">
                    <button
                        disabled={!showContinue}
                        className="px-6 py-3 rounded-md ring ring-white/50 hover:not-disabled:ring-2 hover:not-disabled:ring-white text-xl font-bold  bg-[#1f3c67] disabled:bg-[#071e32] disabled:text-white/50 disabled:ring-white/15 disabled:cursor-not-allowed transition-discrete transition-all"
                        onClick={() => {
                            continueGame();
                        }}
                    >
                        Continue
                    </button>
                </div>
            )}

            <footer className="grid grid-cols-3 text-center items-center justify-items-center w-full py-3 my-8 gap-1">
                <span className="justify-self-start">
                    Inspired by{" "}
                    <a className="underline" href="https://rule34dle.vercel.app/" target="_blank" rel="noopener noreferrer">
                        Rule34dle
                    </a>
                    {" | "}
                    <a
                        className="underline"
                        href="https://github.com/teamstarfall/e621dle"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Github Repo
                    </a>
                </span>
                <span className="flex flex-col justify-self-center">
                    <span>
                        Made with 💚💙 by <b>Team Starfall</b>
                    </span>
                    <span>
                        (
                        <a className="underline" href="https://angelolz.one" target="_blank" rel="noopener noreferrer">
                            angelolz
                        </a>
                        {" + "}
                        <a
                            className="underline"
                            href="https://twitter.com/azuretoast"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            AzureToast
                        </a>
                        )
                    </span>
                </span>

                {date && <span className="justify-self-end">Data is based on {date}.</span>}
            </footer>
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
    );
}
