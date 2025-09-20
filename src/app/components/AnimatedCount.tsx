import { useEffect, useState } from "react";
import { Tag } from "../interfaces";
import { INCREMENT_ANIM_MS } from "../constants";

export default function AnimatedNumber({ isRevealed, tag }: { isRevealed: boolean; tag: Tag }) {
    const [animatedCount, setAnimatedCount] = useState<number>(0);
    const displayCount = () => {
        if (!isRevealed) {
            return "?";
        }
        // If the animation is running, show the animated count, otherwise show the final tag count.
        return animatedCount.toLocaleString();
    };

    //animate incrementing count when choice is made
    useEffect(() => {
        if (isRevealed) {
            let startTime: number | null = null;

            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime;
                const elapsedTime = currentTime - startTime;
                let progress = Math.min(elapsedTime / INCREMENT_ANIM_MS, 1);
                progress = 1 - Math.pow(1 - progress, 3);
                const currentCount = Math.floor(tag.count * progress);
                setAnimatedCount(currentCount);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }
    }, [isRevealed, tag]);

    return <span className="text-[32px] md:text-[42px] font-bold leading-none">{displayCount()}</span>;
}
