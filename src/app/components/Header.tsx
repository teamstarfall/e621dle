"use client";

import Image from "next/image";
import { useState } from "react";
import Modal from "./Modal";
import Settings from "./Settings";
import { WHICH_TAG_TEXT } from "../constants";
import GameModeToggle from "./GameModeToggle";
import { HeaderProps } from "../interfaces";

export default function Header({ gameMode, setGameMode, currentStreak, bestStreak }: HeaderProps) {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <header className="flex flex-row justify-between sm:grid sm:grid-cols-[1fr_auto_1fr] bg-[#0f223d] border-b-1 shadow-md sm:shadow-none sm:bg-transparent sm:border-0 items-center w-full sticky top-0 z-10 px-4 py-2 sm:static mt-0 sm:p-0 sm:mt-6">
            <div className="justify-self-start flex flex-col items-center">
                <Image src="/logo.png" alt="e621dle logo" width={256} height={81} className="w-20 h-auto sm:w-48" />
                {/* <GameModeToggle gameMode={gameMode} setGameMode={setGameMode} /> */}
            </div>
            <div className="justify-self-center flex flex-col items-center">
                <div className="text-center text-2xl md:text-3xl hidden sm:block sm:pb-4">
                    <span className="sm:inline font-bold">{WHICH_TAG_TEXT}</span>
                </div>
                <div className="flex flex-row items-center px-2 py-1 sm:px-4 sm:py-2 border-1 rounded-xl bg-[#071e32] justify-items-center">
                    <span className="flex flex-row text-center justify-center items-center">
                        <span className="font-bold whitespace-nowrap">Current</span>
                        <span className="font-bold text-[24px] sm:text-[32px] ml-2">{currentStreak}</span>
                    </span>
                    <div className="h-4 sm:h-8 w-px bg-gray-400 mx-2" />
                    <span className="flex flex-row text-center justify-center items-center">
                        <span className="font-bold whitespace-nowrap">Best</span>
                        <span className="font-bold text-[24px] sm:text-[32px] ml-2">{bestStreak}</span>
                    </span>
                </div>
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
                    <Settings />
                </div>
            </div>

            <Modal isRevealed={showSettings} onClose={() => setShowSettings(false)}>
                <Settings />
            </Modal>
        </header>
    );
}
