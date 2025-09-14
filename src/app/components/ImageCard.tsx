"use client";

import { memo } from "react";
import Image from "next/image";

const ImageCard = memo(function ImageCard({
    currentSrc,
    tagName,
    handleError,
}: {
    currentSrc: string;
    tagName: string;
    handleError: () => void;
}) {
    return (
        <>
            {currentSrc ? (
                <Image
                    key={currentSrc}
                    src={currentSrc}
                    alt={tagName}
                    unoptimized
                    fill
                    className="object-contain rounded-md"
                    onError={handleError}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 sm:gap-6">
                    <div className="relative flex items-center justify-center">
                        <Image
                            src="/no-image.png"
                            alt="No image found"
                            width={300}
                            height={300}
                            className="object-contain rounded-md h-auto w-36 sm:w-48"
                        />
                    </div>
                    <p className="text-center italic text-gray-500">Couldn&apos;t get image.</p>
                </div>
            )}
        </>
    );
});

export default ImageCard;
