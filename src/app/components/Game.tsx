"use client";

import { useState, useEffect, useMemo, use } from "react";
import { Tag, GameProps } from "../interfaces";
import TagCard from "./TagCard";
import { BEST_STREAK, DAILY_GAME, INCREMENT_ANIM_MS, MAX_ROUNDS, SHOW_ANSWER_TIME_MS, WHICH_TAG_TEXT } from "../constants";
import Modal from "../components/Modal";
import { useLocalStorage, useSettings } from "../storage";

function getRandomTag(tags: Tag[]): Tag | null {
    if (!tags || tags.length === 0) return null;
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

const generateDailyPosts = (tags: Tag[], date: string) => {
    if (!tags) return;

    const seed = xmur3(date)();
    const rand = mulberry32(seed);

    const pairs: [Tag, Tag][] = [];
    const used = new Set<number>();

    while (tags.length < MAX_ROUNDS && used.size < tags.length) {
        const firstIdx = Math.floor(rand() * tags.length);
        let secondIdx = Math.floor(rand() * tags.length);

        //prevent duplicates
        while (secondIdx === firstIdx) {
            secondIdx = Math.floor(rand() * tags.length);
        }

        if (used.has(firstIdx) || used.has(secondIdx)) continue;

        pairs.push([tags[firstIdx], tags[secondIdx]]);
        used.add(firstIdx);
        used.add(secondIdx);
    }
};

const initRoundResults = (date: string) => {
    return {
        date: date,
        results: Array.from({ length: 10 }, () => ({ result: "unknown" })),
    };
};

import Header from "./Header";
import Footer from "./Footer";
import { mulberry32, xmur3 } from "../utils/rng";

export default function Game({ posts }: GameProps) {
    const { tags, date } = use(posts);
    const dailyTags = generateDailyPosts(tags, date);
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
    const [showContinue, setShowContinue] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [animatedCount, setAnimatedCount] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [gameMode, setGameMode] = useState<"Daily" | "Endless">("Daily");

    //daily states
    const [currentRound, setCurrentRound] = useState(0);
    const [isViewingRound, setIsViewingRound] = useState(false);
    const [roundResults, setRoundResults] = useLocalStorage<any>(DAILY_GAME, initRoundResults);

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

    const continueGame = () => {
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
    };

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
                setGameOver(true);
            }, SHOW_ANSWER_TIME_MS);
        }
        setIsRevealed(true);
    };

    const restartRound = () => {
        setShowCharactersOnly(characterTagsOnly);
        setCurrentStreak(0);
        setShowGameOverModal(false);
        setIsRevealed(false);
        setGameOver(false);

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
        <div
            id="container"
            className="font-sans items-center flex flex-col min-h-screen max-w-[1200px] mx-auto w-full px-1 sm:px-4"
        >
            <Header
                gameMode={gameMode}
                setGameMode={setGameMode}
                currentStreak={currentStreak}
                bestStreak={bestStreak ?? 0}
            />

            <main className="flex flex-col text-center gap-4 w-full rounded-xl my-4 sm:my-12 px-4 sm:px-0">
                {!leftTag || !rightTag ? (
                    <div className="flex items-center justify-center text-center mx-auto">Loading tags...</div>
                ) : (
                    <div
                        className={`flex flex-col sm:grid md:grid-cols-[1fr_auto_1fr] gap-4 h-full w-full items-center rounded-xl`}
                    >
                        <span className="inline sm:hidden text-2xl font-bold">{WHICH_TAG_TEXT}</span>
                        <TagCard
                            tag={leftTag}
                            isRevealed={isRevealed}
                            handleChoice={handleChoice}
                            choice="lower"
                            getCategoryName={getCategoryName}
                            ratingLevel={ratingLevel ?? "Safe"}
                        />
                        <div className="font-bold sm:my-auto sm:px-4 justify-self-center">
                            <span className="text-3xl p-0 sm:py-4">or</span>
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
                    </div>
                )}
            </main>

            {pause && !gameOver && (
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
            {gameOver && (
                <div className="flex flex-row gap-4 w-full items-center justify-center">
                    <button
                        disabled={!gameOver}
                        className="px-6 py-3 rounded-md ring ring-white/50 hover:not-disabled:ring-2 hover:not-disabled:ring-white text-xl font-bold  bg-[#1f3c67] disabled:bg-[#071e32] disabled:text-white/50 disabled:ring-white/15 disabled:cursor-not-allowed transition-discrete transition-all"
                        onClick={() => {
                            restartRound();
                        }}
                    >
                        Play Again
                    </button>
                </div>
            )}

            <Footer date={date} />
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
