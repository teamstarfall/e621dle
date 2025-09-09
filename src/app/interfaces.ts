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

export interface TagDisplayProps {
    tag: Tag | null;
    isRevealed: boolean;
    handleChoice: (choice: "higher" | "lower") => void;
    choice: "higher" | "lower";
    getCategoryName: (category: number) => string;
    animatedCount?: number;
    ratings: Ratings;
}
