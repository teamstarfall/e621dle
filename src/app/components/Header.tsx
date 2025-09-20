"use client";

import Image from "next/image";
import { useState } from "react";
import Modal from "./Modal";
import Settings from "./Settings";
import { WHICH_TAG_TEXT } from "../constants";
import GameModeToggle from "./GameModeToggle";
import { HeaderProps } from "../interfaces";
import Scoreboard from "./Scoreboard";

export default function Header({ gameMode, setGameMode, currentStreak, bestStreak, roundResults }: HeaderProps) {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <header className="flex flex-row justify-between sm:grid sm:grid-cols-[1fr_auto_1fr] bg-[#0f223d] border-b-1 shadow-md sm:shadow-none sm:bg-transparent sm:border-0 items-center w-full sticky top-0 z-10 px-4 py-2 sm:static mt-0 sm:p-0 sm:mt-6">
            <div className="justify-self-start flex flex-col items-center">
                <Image src="/logo.png" alt="e621dle logo" width={256} height={81} className="w-20 h-auto sm:w-48" />
                <GameModeToggle gameMode={gameMode} setGameMode={setGameMode} />
            </div>
            <div className="justify-self-center flex flex-col items-center mx-2">
                <div className="text-center hidden sm:block sm:pb-4">
                    <span className="sm:inline font-bold text-2xl">{WHICH_TAG_TEXT}</span>
                </div>
                <Scoreboard
                    gameMode={gameMode}
                    currentStreak={currentStreak}
                    bestStreak={bestStreak}
                    roundResults={roundResults}
                    showProgress
                />
            </div>
            <div className="justify-self-end">
                <div className="sm:hidden">
                    <button onClick={() => setShowSettings(true)} className="text-white">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                </div>
                <div className="hidden sm:block">
                    <Settings gameMode={gameMode} />
                </div>
            </div>

            <Modal isRevealed={showSettings} onClose={() => setShowSettings(false)}>
                <Settings gameMode={gameMode} />
            </Modal>
        </header>
    );
}
