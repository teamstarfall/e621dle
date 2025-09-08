"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Tag } from "../interfaces";

export default function ImageCard({ tag }: { tag: Tag }) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        setSrc(tag.images.safe.url);
    }, [tag]);

    return (
        <>{src && <Image src={src} alt={tag.name} fill className="object-contain rounded-md" onError={() => {}} />}</>
    );
}
