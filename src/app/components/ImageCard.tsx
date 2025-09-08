"use client";

import { memo, useEffect, useState } from "react";
import Image from "next/image";
import { Tag } from "../interfaces";

const ImageCard = memo(function ImageCard({ tag }: { tag: Tag }) {
    const [src, setSrc] = useState(tag.images.safe.url);

    useEffect(() => {
        // Reset src when the tag changes
        setSrc(tag.images.safe.url);
    }, [tag]);

    const handleError = () => {
        if (src === tag.images.safe.url) {
            setSrc(tag.images.questionable.url);
        } else {
            setSrc(null);
        }
    };

    return (
        <>
            {src && (
                <Image
                    src={src}
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
