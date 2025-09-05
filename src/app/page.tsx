"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

function randomNumber() {
    return Math.floor(Math.random() * 10000);
}

export default function Home() {
    const [leftNumber, setLeftNumber] = useState(0);
    const [rightNumber, setRightNumber] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [isClient, setIsClient] = useState(false);

    const [choice, setChoice] = useState<"higher" | "lower" | null>(null);

    useEffect(() => {
        setIsClient(true);
        setLeftNumber(randomNumber());
        setRightNumber(randomNumber());
    }, []);

    const [isCorrect, setIsCorrect] = useState(false);

    const handleChoice = (choice: "higher" | "lower") => {
        if (isRevealed) return;

        setChoice(choice);

        const isCorrect =
            (choice === "higher" && rightNumber >= leftNumber) || (choice === "lower" && rightNumber <= leftNumber);

        if (isCorrect) {
            setIsCorrect(true);
            setCurrentStreak(currentStreak + 1);
            if (currentStreak + 1 > bestStreak) {
                setBestStreak(currentStreak + 1);
            }
            setTimeout(() => {
                setLeftNumber(rightNumber);
                setRightNumber(randomNumber());
                setIsRevealed(false);
                setChoice(null);
                setIsCorrect(false);
            }, 4000);
        } else {
            setCurrentStreak(0);
            setTimeout(() => {
                setLeftNumber(randomNumber());
                setRightNumber(randomNumber());
                setIsRevealed(false);
                setChoice(null);
            }, 2000);
        }

        setIsRevealed(true);
    };

    const getBorderColor = (buttonChoice: "higher" | "lower") => {
        if (!isRevealed) return "border-gray-600";

        const isCorrect =
            (choice === "higher" && rightNumber >= leftNumber) || (choice === "lower" && rightNumber <= leftNumber);

        if (choice === buttonChoice) {
            return isCorrect ? "border-green-500 border-4" : "border-red-500 border-4";
        } else {
            return isCorrect ? "border-red-500 border-4" : "border-green-500 border-4";
        }
    };

    return (
        <div
            id="container"
            className="font-sans items-center justify-items-center min-h-screen h-full max-w-[1200px] mx-auto w-screen p-8 pb-20"
        >
            <header className="flex flex-col gap-[16px] justify-center text-center border-3 rounded-xl p-[16px] w-full bg-[#4a5568] shadow-xl">
                <h2>Angel's Epic Game</h2>
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
                    : "Which one has more posts?"}
            </div>
            <main className="flex flex-col text-center gap-[12px] my-[20px] min-h-[500px] w-full items-stretch rounded-xl">
                <div
                    className={`flex flex-row gap-[16px] h-full w-full row-start-2 items-center sm:items-start rounded-xl ${
                        isCorrect ? "animate-shake" : "animate-fade-in-up"
                    }`}
                >
                    <div
                        className={`flex flex-col grow gap-[12px] w-full h-full p-6 bg-[#071e32] border-4 hover:bg-gray-600 rounded-xl shadow-2xl ${
                            isRevealed ? "cursor-not-allowed" : "cursor-pointer"
                        } ${getBorderColor("lower")}`}
                        onClick={() => handleChoice("lower")}
                    >
                        <span className="font-bold text-[20px]">Pic 1</span>
                        <div className="flex flex-col mb-[0px]">
                            <span className="min-h-[100px] max-h-[250px] h-[500px] my-[12px] bg-gray-500 rounded-md"></span>
                            <span className="text-[42px] font-bold leading-none">{isClient ? leftNumber : "..."}</span>
                            <span>posts</span>
                        </div>
                    </div>
                    <div className="text-3xl font-bold my-auto">or</div>
                    <div
                        className={`flex flex-col grow gap-[12px] w-full h-full p-6 bg-[#071e32] border-4 hover:bg-gray-600 rounded-xl shadow-2xl ${
                            isRevealed ? "cursor-not-allowed" : "cursor-pointer"
                        } ${getBorderColor("higher")}`}
                        onClick={() => handleChoice("higher")}
                    >
                        <span className="font-bold text-[20px]">Pic 2</span>
                        <div className="flex flex-col mb-[0px]">
                            <span className="min-h-[100px] max-h-[250px] h-[500px] my-[12px] bg-gray-500 rounded-md"></span>
                            <span className="text-[42px] font-bold leading-none">{isRevealed ? rightNumber : "?"}</span>
                            <span>posts</span>
                        </div>
                    </div>
                </div>
            </main>
            <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center bg-[#4a5568] bottom-[24px] border-3 rounded-xl shadow-xl w-full">
                Created by Team Starfall
            </footer>
        </div>
    );
}
