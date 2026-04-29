"use client";

import { useEffect, useState } from "react";

const getTimeUntilMidnight = () => {
    const now = new Date();
    const tomorrowUtc = new Date(now);
    tomorrowUtc.setUTCDate(now.getUTCDate() + 1);
    tomorrowUtc.setUTCHours(0, 0, 0, 0);

    const timeLeft = tomorrowUtc.getTime() - now.getTime();

    const hours = Math.floor((timeLeft / 1000 / 60 / 60) % 24)
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

export default function DailyCountdown() {
    const [timeLeft, setTimeLeft] = useState(() => getTimeUntilMidnight());

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(getTimeUntilMidnight());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <p>Next daily in:</p>
            <p className="font-bold text-[24px]">{timeLeft}</p>
            <p className="italic text-gray-400">(Resets at 12am UTC)</p>
        </div>
    );
}
