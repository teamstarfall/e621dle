import { ReactNode } from "react";

export interface Tag {
    name: string;
    category: number;
    count: number;
    rating: string;
    aliases: string[];
    images: ImagePreviews;
}

export interface TagResponse {
    date: string;
    tags: Tag[];
}

export interface ImagePreviews {
    explicit: TopRating;
    questionable: TopRating;
    safe: TopRating;
}

export interface TopRating {
    url: string;
    score: number;
    fileExt: string;
}

export interface Ratings {
    explicit: boolean;
    questionable: boolean;
    safe: boolean;
}

export type RatingLevel = "Explicit" | "Questionable" | "Safe" | "No Images";

export interface TagDisplayProps {
    tag: Tag | null;
    isRevealed: boolean;
    handleChoice: (choice: "higher" | "lower") => void;
    choice: "higher" | "lower";
    getCategoryName: (category: number) => string;
    animatedCount?: number;
    ratingLevel: RatingLevel;
}

export interface ModalProps {
    isRevealed: boolean;
    onClose: () => void;
    children: ReactNode;
}

export interface SettingsProps {
    ratingLevel: RatingLevel;
    setRatingLevel: React.Dispatch<React.SetStateAction<RatingLevel>>;
    characterTagsOnly: boolean;
    toggleCharacters: (value: boolean) => void;
}
