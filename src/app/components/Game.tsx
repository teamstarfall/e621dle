"use client";

import { useState, useEffect, useMemo, use, useRef } from "react";
import { Tag, GameProps, RoundResults, GameMode, Choice } from "../interfaces";
import TagCard from "./TagCard";
import { BEST_STREAK, DAILY_GAME, MAX_ROUNDS, SHOW_ANSWER_TIME_MS, WHICH_TAG_TEXT } from "../constants";
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
    if (!tags) return null;

    const seed = xmur3(date)();
    const rand = mulberry32(seed);

    const pairs: [Tag, Tag][] = [];
    const used = new Set<number>();

    while (pairs.length < MAX_ROUNDS && used.size < tags.length) {
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
    return pairs;
};

const initRoundResults = () => {
    const today = new Date();

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const dd = String(today.getDate()).padStart(2, "0");

    const formatted = `${yyyy}-${mm}-${dd}`;
    return {
        date: formatted,
        results: Array(10).fill("u"),
    };
};

import Header from "./Header";
import Footer from "./Footer";
import { mulberry32, xmur3 } from "../utils/rng";

export default function Game({ posts }: GameProps) {
    const { tags, date } = use(posts);
    const dailyTags = useMemo(() => generateDailyPosts(tags, date), [tags, date]);
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
    const [gameOver, setGameOver] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [gameMode, setGameMode] = useState<GameMode>("Endless");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    //daily states
    const [isViewingRound, setIsViewingRound] = useState(false);
    const [roundResults, setRoundResults] = useLocalStorage<RoundResults>(DAILY_GAME, initRoundResults());
    const [displayedRoundResults, setDisplayedRoundResults] = useState(roundResults);

    const firstUnplayedIndex = useMemo(() => {
        const index = roundResults?.results.indexOf("u");
        if (index === -1) {
            return MAX_ROUNDS - 1;
        }
        return index ?? 0;
    }, [roundResults]);
    const [currentRound, setCurrentRound] = useState(firstUnplayedIndex);

    //stop animation when changing game modes
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [gameMode]);

    //initally set tags
    useEffect(() => {
        if (gameMode === "Endless") {
            if (showCharactersOnly === null) {
                setShowCharactersOnly(characterTagsOnly);
                return;
            }

            if (leftTag === null || rightTag === null) {
                setLeftTag(getRandomTag(filteredTags));
                setRightTag(getRandomTag(filteredTags));
            }
        } else {
            console.log(currentRound);
            if (dailyTags && (leftTag === null || rightTag === null)) {
                const current = dailyTags[currentRound];
                setLeftTag(current[0]);
                setRightTag(current[1]);
            }
        }
    }, [characterTagsOnly, currentRound, dailyTags, filteredTags, gameMode, leftTag, rightTag, showCharactersOnly]);

    const continueGame = () => {
        setCurrentStreak((prev) => prev + 1);
        if (currentStreak + 1 > (bestStreak ?? 0)) {
            setBestStreak(currentStreak + 1);
            localStorage.setItem(BEST_STREAK, (currentStreak + 1).toString());
        }

        setLeftTag(rightTag);
        const newRightTag = getRandomTag(filteredTags);
        setRightTag(newRightTag);
        setIsRevealed(false);
        setShowContinue(false);
    };

    const nextRound = () => {
        if (!roundResults || !dailyTags) return;

        const nextRoundIndex = currentRound + 1;
        setDisplayedRoundResults(roundResults);
        setIsRevealed(false);
        setShowContinue(false);

        if (nextRoundIndex < dailyTags.length) {
            const current = dailyTags[nextRoundIndex];
            setLeftTag(current[0]);
            setRightTag(current[1]);
            setCurrentRound(nextRoundIndex);
        } else {
            // todo finished daily
        }
    };

    const handleChoice = (selectedChoice: Choice) => {
        if (isRevealed || !leftTag || !rightTag) return;

        const wasCorrect =
            (selectedChoice === "right" && rightTag.count >= leftTag.count) ||
            (selectedChoice === "left" && rightTag.count <= leftTag.count);

        setIsRevealed(true);

        if (gameMode === "Endless") {
            if (wasCorrect) {
                timeoutRef.current = setTimeout(() => {
                    if (pause) {
                        setShowContinue(true);
                    } else {
                        continueGame();
                    }
                }, SHOW_ANSWER_TIME_MS);
            } else {
                timeoutRef.current = setTimeout(() => {
                    setShowGameOverModal(true);
                    setGameOver(true);
                }, SHOW_ANSWER_TIME_MS);
            }
        } else {
            if (roundResults) {
                const newResults = [...roundResults.results];
                newResults[currentRound] = wasCorrect ? "c" : "i";
                const newRoundResults = { ...roundResults, results: newResults };
                setRoundResults(newRoundResults);
            }

            timeoutRef.current = setTimeout(() => {
                if (pause) {
                    setShowContinue(true);
                } else {
                    nextRound();
                }
            }, SHOW_ANSWER_TIME_MS);
        }
    };

    const handleGameModeChange = (mode: GameMode) => {
        if (mode === gameMode) return;

        setGameMode(mode);

        if (mode === "Endless") {
            restartRound();
        } else {
            if (!dailyTags) return;

            if (currentRound === MAX_ROUNDS - 1) {
                setIsViewingRound(true);
                setIsRevealed(true);
            } else {
                setIsRevealed(false);
            }

            setShowContinue(false);

            const current = dailyTags[currentRound];
            setLeftTag(current[0]);
            setRightTag(current[1]);
        }
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
                setGameMode={handleGameModeChange}
                currentStreak={currentStreak}
                bestStreak={bestStreak ?? 0}
                roundResults={displayedRoundResults}
            />

            <main className="flex flex-col text-center gap-4 w-full rounded-xl my-4 sm:my-12 px-4 sm:px-0">
                {!leftTag || !rightTag ? (
                    <div className="flex items-center justify-center text-center mx-auto">Loading tags...</div>
                ) : (
                    <div
                        className={`flex flex-col sm:grid md:grid-cols-[1fr_auto_1fr] gap-4 h-full w-full items-center rounded-xl`}
                    >
                        <span className="inline sm:hidden text-2xl font-bold">{WHICH_TAG_TEXT}</span>
                        {/*todo move animatedCount to tagCard*/}
                        <TagCard
                            tag={leftTag}
                            isRevealed={isRevealed}
                            handleChoice={handleChoice}
                            choice="left"
                            getCategoryName={getCategoryName}
                            ratingLevel={ratingLevel ?? "Safe"}
                            gameMode={gameMode}
                        />
                        <div className="font-bold sm:my-auto sm:px-4 justify-self-center">
                            <span className="text-3xl p-0 sm:py-4">or</span>
                        </div>
                        <TagCard
                            tag={rightTag}
                            isRevealed={isRevealed}
                            handleChoice={handleChoice}
                            choice="right"
                            getCategoryName={getCategoryName}
                            ratingLevel={ratingLevel ?? "Safe"}
                            gameMode={gameMode}
                        />
                    </div>
                )}
            </main>

            {pause && !gameOver && (
                <div className="flex flex-row gap-4 w-full items-center justify-center">
                    <button
                        disabled={!showContinue || currentRound === MAX_ROUNDS - 1}
                        className="px-6 py-3 rounded-md ring ring-white/50 hover:not-disabled:ring-2 hover:not-disabled:ring-white text-xl font-bold  bg-[#1f3c67] disabled:bg-[#071e32] disabled:text-white/50 disabled:ring-white/15 disabled:cursor-not-allowed transition-discrete transition-all"
                        onClick={() => {
                            if (gameMode === "Endless") {
                                continueGame();
                            } else {
                                nextRound();
                            }
                        }}
                    >
                        {gameMode === "Endless" ? "Continue" : "Next Round"}
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
