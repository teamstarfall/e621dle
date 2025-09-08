export interface Tag {
    name: string;
    category: number;
    count: number;
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
}
