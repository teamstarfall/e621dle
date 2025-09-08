"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Tag } from "../interfaces";

const ImageCard = memo(function ImageCard({ tag }: { tag: Tag }) {
    const sources = useMemo(() => {
        const potential = [];
        const ratings: (keyof Tag["images"])[] = ["safe", "questionable"];

        for (const rating of ratings) {
            const url = tag.images[rating]?.url;
            if (url) {
                potential.push(url);
                potential.push(url.replace("/sample/", "/"));
            }
        }
        return potential;
    }, [tag]);

    const [sourceIndex, setSourceIndex] = useState(0);

    useEffect(() => {
        setSourceIndex(0);
    }, [tag]);

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
