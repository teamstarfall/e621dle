"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImagePreviews, RatingLevel, Tag } from "../interfaces";

const ImageCard = memo(function ImageCard({ tag, ratingLevel }: { tag: Tag; ratingLevel: RatingLevel }) {
    const sources = useMemo(() => {
        if (ratingLevel === "No Images") {
            return [];
        }

        const potential = [];
        const ratingsToShow: (keyof ImagePreviews)[] = [];

        if (ratingLevel === "Safe") {
            ratingsToShow.push("safe");
        } else if (ratingLevel === "Questionable") {
            ratingsToShow.push("questionable", "safe");
        } else if (ratingLevel === "Explicit") {
            ratingsToShow.push("explicit", "questionable", "safe");
        }

        for (const rating of ratingsToShow) {
            const md5 = tag.images[rating]?.md5;
            const fileExt = tag.images[rating]?.fileExt;
            if (md5) {
                potential.push(`https://static1.e621.net/data/${md5.substring(0, 2)}/${md5.substring(2, 4)}/${md5}.jpg`);
                potential.push(
                    `https://static1.e621.net/data/${md5.substring(0, 2)}/${md5.substring(2, 4)}/${md5}.${fileExt}`
                );
            }
        }
        return potential;
    }, [tag, ratingLevel]);

    const [sourceIndex, setSourceIndex] = useState(0);

    useEffect(() => {
        setSourceIndex(0);
    }, [tag, ratingLevel]);

    const handleError = () => {
        setSourceIndex((prevIndex) => prevIndex + 1);
    };

    const currentSrc = sources[sourceIndex];

    return (
        <>
            {currentSrc ? (
                <Image
                    key={currentSrc}
                    src={currentSrc}
                    alt={tag.name}
                    fill
                    className="object-contain rounded-md"
                    unoptimized
                    onError={handleError}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                    <div className="relative flex items-center justify-center">
                        <Image
                            src="/no-image.png"
                            alt="No image found"
                            width={175}
                            height={175}
                            className="object-contain rounded-md"
                        />
                    </div>
                    <p className="text-center italic text-gray-500">Couldn&apos;t get image.</p>
                </div>
            )}
        </>
    );
});

export default ImageCard;
