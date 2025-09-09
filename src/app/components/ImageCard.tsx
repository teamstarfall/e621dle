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
    }, [tag]);

    const [sourceIndex, setSourceIndex] = useState(0);

    useEffect(() => {
        setSourceIndex(0);
    }, [tag, selectedRatings]);

    const handleError = () => {
        if (sourceIndex + 1 < sources.length) {
            console.log(`Failed to load image: ${sources[sourceIndex]}, currently trying: ${sources[sourceIndex + 1]}`);
            setSourceIndex((prevIndex) => prevIndex + 1);
        }
    };

    const currentSrc = sources[sourceIndex];

    return (
        <>
            {currentSrc && (
                <Image
                    key={currentSrc}
                    src={currentSrc}
                    alt={tag.name}
                    fill
                    className="object-contain rounded-md"
                    unoptimized
                    onError={handleError}
                />
            )}
        </>
    );
});

export default ImageCard;
