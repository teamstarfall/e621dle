"use client";

import { useState, useEffect, useMemo, use, useRef } from "react";
import { Tag, GameProps, RoundResults, GameMode, Choice } from "../interfaces";
import { BEST_STREAK, DAILY_GAME, MAX_ROUNDS, SHARE_SCORE, SHOW_ANSWER_TIME_MS, WHICH_TAG_TEXT, URL } from "../constants";
import { useLocalStorage, useSettings } from "../storage";
import { mulberry32, xmur3 } from "../utils/rng";
import TagCard from "./TagCard";
import Modal from "./Modal";
import Header from "./Header";
import Footer from "./Footer";
import Scoreboard from "./Scoreboard";

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

const generateDailyPosts = (tags: Tag[]) => {
    if (!tags) return null;

    console.log("current time: ", new Date().toISOString());
    const seed = xmur3(new Date().toISOString().split("T")[0])();
    const rand = mulberry32(seed);

    const pairs: [Tag, Tag][] = [];
    const used = new Set<number>();

    while (pairs.length < MAX_ROUNDS && used.size < tags.length) {
        const firstIdx = Math.floor(rand() * tags.length);
        if (used.has(firstIdx)) continue;

        const firstTag = tags[firstIdx];

        // filter valid candidates
        const candidates = tags
            .map((tag, idx) => ({ tag, idx }))
            .filter(({ tag, idx }) => idx !== firstIdx && !used.has(idx) && Math.abs(firstTag.count - tag.count) < 40000);

        if (candidates.length === 0) {
            // no valid pair for this firstTag, skip
            used.add(firstIdx);
            continue;
        }

        const { idx: secondIdx } = candidates[Math.floor(rand() * candidates.length)];
        pairs.push([firstTag, tags[secondIdx]]);
        used.add(firstIdx);
        used.add(secondIdx);
    }

    return pairs;
};

const initRoundResults = () => {
    return {
        date: new Date().toISOString().split("T")[0],
        results: Array(MAX_ROUNDS).fill("u"),
    };
};

const getTimeUntilMidnight = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // next day 12:00 AM
    const timeLeft = tomorrow.getTime() - now.getTime(); // milliseconds

    const hours = Math.floor(timeLeft / 1000 / 60 / 60)
        .toString()
        .padStart(2, "0");
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60)
        .toString()
        .padStart(2, "0");
    const seconds = Math.floor((timeLeft / 1000) % 60)
        .toString()
        .padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
};

export default function Game({ posts }: GameProps) {
    const { tags, date } = use(posts);
    const dailyTags = useMemo(() => generateDailyPosts(tags), [tags]);
    const [bestStreak, setBestStreak] = useLocalStorage<number>(BEST_STREAK, 0);

    // settings
    const { ratingLevel, characterTagsOnly, showAdultWarning, setShowAdultWarning, pause } = useSettings();
    const [displayCharactersCurrentGame, setShowCharactersOnly] = useState(characterTagsOnly);

    const filteredTags = useMemo(() => {
        if (displayCharactersCurrentGame) {
            return tags.filter((tag) => tag.category === 4);
        }
        return tags;
    }, [tags, displayCharactersCurrentGame]);

    //game states
    const [leftTag, setLeftTag] = useState<Tag | null>(null);
    const [rightTag, setRightTag] = useState<Tag | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [showContinue, setShowContinue] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [showGameOverModal, setShowGameOverModal] = useState(false);
    const [gameMode, setGameMode] = useState<GameMode>("Daily");
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    //daily states
    const [isViewingRound, setIsViewingRound] = useState(false);
    const [roundResults, setRoundResults] = useLocalStorage<RoundResults>(DAILY_GAME, initRoundResults());
    const [displayedRoundResults, setDisplayedRoundResults] = useState<RoundResults | null>(null);
    const [currentRound, setCurrentRound] = useState(0);
    const [showFinishedModal, setShowFinishedModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [copyText, setCopyText] = useState(SHARE_SCORE);

    //stop animation when changing game modes
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [gameMode]);

    //initally set daily
    useEffect(() => {
        if (!roundResults || displayedRoundResults) return; //already init'd

        setDisplayedRoundResults(roundResults);

        let index = roundResults?.results.indexOf("u");
        if (index === -1) {
            index = MAX_ROUNDS;
            setIsViewingRound(true);
            setIsRevealed(true);
            setShowFinishedModal(true);
            setShowContinue(true);
        }

        setCurrentRound(index ?? 0);

        if (gameMode === "Daily" && dailyTags) {
            const current = dailyTags[Math.min(index, MAX_ROUNDS - 1)];
            setLeftTag(current[0]);
            setRightTag(current[1]);
        }
    }, [currentRound, dailyTags, displayedRoundResults, gameMode, roundResults]);

    //timer for next daily
    useEffect(() => {
        setTimeLeft(getTimeUntilMidnight());

        const interval = setInterval(() => {
            setTimeLeft(getTimeUntilMidnight());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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

    const nextRound = (index?: number, results?: RoundResults) => {
        if (!roundResults || !dailyTags) return;

        setDisplayedRoundResults(results ?? roundResults);
        setShowContinue(false);

        const newIndex = index ?? currentRound;
        if (newIndex < dailyTags.length) {
            setIsRevealed(false);
            const current = dailyTags[newIndex];
            setLeftTag(current[0]);
            setRightTag(current[1]);
            setCurrentRound(newIndex);
        } else {
            finalizeDaily();
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
            if (!roundResults) return;

            const newResults = [...roundResults.results];
            newResults[currentRound] = wasCorrect ? "c" : "i";
            const newRoundResults = { ...roundResults, results: newResults };
            setRoundResults(newRoundResults);
            setCurrentRound(currentRound + 1);

            timeoutRef.current = setTimeout(() => {
                if (pause) {
                    setShowContinue(true);
                    if (currentRound + 1 === MAX_ROUNDS) {
                        finalizeDaily();
                        setDisplayedRoundResults(newRoundResults);
                    }
                } else {
                    // if round proceeds automatically, the states aren't updated yet for nextRound()
                    nextRound(currentRound + 1, newRoundResults);
                }
            }, SHOW_ANSWER_TIME_MS);
        }
    };

    const handleGameModeChange = (mode: GameMode) => {
        if (mode === gameMode || (isRevealed && !isViewingRound)) return;

        setShowContinue(false);
        setGameMode(mode);
        setIsRevealed(false);

        if (mode === "Endless") {
            restartRound();
            setShowFinishedModal(false);
        } else {
            if (!dailyTags) return;

            setShowGameOverModal(false);
            if (currentRound === MAX_ROUNDS) {
                finalizeDaily();
            } else {
                setIsRevealed(false);
            }

            setDisplayedRoundResults(roundResults);

            const current = dailyTags[Math.min(currentRound, MAX_ROUNDS - 1)];
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

    const copyScore = () => {
        const text = [];
        text.push(
            `e621dle Daily - ${new Date().toISOString().split("T")[0]} - ${
                roundResults?.results.filter((r) => r.includes("c")).length ?? 0
            }/${MAX_ROUNDS}`
        );
        text.push(roundResults?.results.map((r) => (r === "c" ? "🟩" : "🟥")).join(""));
        text.push("");
        text.push(URL);

        if (!navigator.clipboard) {
            // fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = text.join("\n");
            textarea.style.position = "fixed"; // prevent scrolling to bottom
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            try {
                document.execCommand("copy");
                setCopyText("Copied!");
                setTimeout(() => {
                    setCopyText(SHARE_SCORE);
                }, 3000);
            } catch (err) {
                console.error("Failed to copy: ", err);
            } finally {
                document.body.removeChild(textarea);
            }
            return;
        }

        navigator.clipboard
            .writeText(text.join("\n"))
            .then(() => {
                setCopyText("Copied!");
                setTimeout(() => {
                    setCopyText(SHARE_SCORE);
                }, 3000);
            })
            .catch((err) => console.error("Failed to copy: ", err));
    };

    const finalizeDaily = () => {
        setIsViewingRound(true);
        setShowFinishedModal(true);
        setIsRevealed(true);
        setShowContinue(true);
        setDisplayedRoundResults(roundResults);
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
            className="font-sans items-center flex flex-col min-h-screen max-w-[1200px] mx-auto w-full px-0 sm:px-4"
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
                        disabled={!showContinue}
                        className="px-6 py-3 rounded-md ring ring-white/50 hover:not-disabled:ring-2 hover:not-disabled:ring-white text-xl font-bold  bg-[#1f3c67] disabled:bg-[#071e32] disabled:text-white/50 disabled:ring-white/15 disabled:cursor-not-allowed transition-discrete transition-all"
                        onClick={() => {
                            if (gameMode === "Endless") {
                                continueGame();
                            } else {
                                if (currentRound === MAX_ROUNDS) {
                                    handleGameModeChange("Endless");
                                } else {
                                    nextRound();
                                }
                            }
                        }}
                    >
                        {gameMode === "Endless"
                            ? "Continue"
                            : currentRound !== MAX_ROUNDS
                            ? "Next Round"
                            : "Play Endless Mode"}
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
            {gameMode === "Endless" ? (
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
            ) : (
                <Modal isRevealed={showFinishedModal} onClose={() => setShowFinishedModal(false)}>
                    <div className="flex flex-col items-center gap-3">
                        <h2 className="pb-2 text-3xl font-bold">Daily Complete!</h2>
                        <div>
                            <p className="font-bold text-xl">{`Your score: ${
                                roundResults?.results.filter((r) => r.includes("c")).length ?? 0
                            }/${MAX_ROUNDS}`}</p>
                            <div className="inline-flex">
                                <Scoreboard gameMode={gameMode} roundResults={roundResults} />
                            </div>
                        </div>
                        <p>Come back again tomorrow for a new daily challenge!</p>
                        <div className="">
                            <p>Next daily in:</p>
                            <p className="font-bold text-[24px]">{timeLeft}</p>
                            <p className="italic text-gray-400">(Resets at 12am UTC)</p>
                        </div>
                    </div>
                    <span className="flex flex-row gap-2 justify-center">
                        <button
                            onClick={() => {
                                handleGameModeChange("Endless");
                            }}
                            className="font-bold mt-4 px-4 py-2 bg-[#071e32]  hover:bg-[#014995] text-white rounded-lg text-lg transition-colors border-1 border-gray-300 shadow-xl"
                        >
                            Play Endless Mode
                        </button>
                        <button
                            onClick={() => copyScore()}
                            className="font-bold mt-4 px-4 py-2 bg-[#071e32]  hover:bg-[#014995] text-white rounded-lg text-lg transition-colors border-1 border-gray-300 shadow-xl"
                        >
                            {copyText}
                        </button>
                    </span>
                </Modal>
            )}
        </div>
    );
}
