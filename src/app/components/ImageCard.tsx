"use client";

import { memo } from "react";
import Image from "next/image";
import { ImageCardProps } from "../interfaces";

const ImageCard = memo(function ImageCard({ currentSrc, tagName, ratingLevel, handleError }: ImageCardProps) {
    const getMessage = () => {
        switch (ratingLevel) {
            case "No Images":
                return '"No Images" setting is enabled.';
            case "Safe":
                return "Couldn't get image (explicit tag).";
            default:
                return "Couldn't get image.";
        }
    };
    return (
        <>
            {currentSrc ? (
                <Image
                    key={currentSrc.url}
                    src={currentSrc.url}
                    alt={tagName}
                    unoptimized
                    fill
                    className="object-contain rounded-md"
                    onError={handleError}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 md:gap-6">
                    <div className="relative flex items-center justify-center">
                        <Image
                            src="/no-image.png"
                            alt="No image found"
                            width={300}
                            height={300}
                            className="object-contain rounded-md h-auto w-36 md:w-48"
                        />
                    </div>
                    <p className="text-center italic text-gray-500">{getMessage()}</p>
                </div>
            )}
        </>
    );
});

export default ImageCard;
