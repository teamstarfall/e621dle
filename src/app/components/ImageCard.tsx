"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Ratings, Tag } from "../interfaces";

const ImageCard = memo(function ImageCard({ tag, selectedRatings }: { tag: Tag; selectedRatings: Ratings }) {
    const sources = useMemo(() => {
        const potential = [];
        const ratings: (keyof Ratings)[] = Object.keys(selectedRatings).filter(
            (key) => selectedRatings[key as keyof Ratings]
        ) as (keyof Ratings)[];

        for (const rating of ratings) {
            const url = tag.images[rating]?.url;
            if (url) {
                potential.push(url);
                potential.push(url.replace("/sample/", "/").replace(".jpg", "." + tag.images[rating]?.fileExt));
            }
        }

        return potential;
    }, [tag, selectedRatings]);

    const [sourceIndex, setSourceIndex] = useState(0);

    useEffect(() => {
        setSourceIndex(0);
    }, [tag, selectedRatings]);

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
                <div className="w-full h-full flex flex-col items-center justify-center">
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
