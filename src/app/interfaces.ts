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
    [key: string]: TopRating;
    explicit: TopRating;
    questionable: TopRating;
    safe: TopRating;
}

export interface TopRating {
    id: string;
    md5: string;
    score: number;
    fileExt: string;
}

export interface Ratings {
    explicit: boolean;
    questionable: boolean;
    safe: boolean;
}

export interface TagCardProps {
    tag: Tag | null;
    isRevealed: boolean;
    handleChoice: (choice: Choice) => void;
    choice: Choice;
    getCategoryName: (category: number) => string;
    animatedCount?: number;
    ratingLevel: RatingLevel;
    gameMode: GameMode;
}

export interface ModalProps {
    isRevealed: boolean;
    onClose: () => void;
    children: ReactNode;
}

export interface ErrorBoundaryState {
    error: Error | null;
    didThrow: boolean;
}

export interface ErrorBoundaryProps {
    fallback?: React.ReactNode;
    children?: React.ReactNode;
}

export interface GameProps {
    posts: Promise<TagResponse>;
    dailyChallenge: Promise<DailyChallenge>;
    dailyStats: Promise<DailyStats>;
}

export interface GameModeProps {
    gameMode: GameMode;
    setGameMode: (mode: GameMode) => void;
}

export interface HeaderProps extends GameModeProps {
    currentStreak: number;
    bestStreak: number;
    roundResults: RoundResults | null;
}

export interface ScoreboardProps {
    gameMode: GameMode;
    currentStreak?: number;
    bestStreak?: number;
    roundResults: RoundResults | null;
    showProgress?: boolean;
    isViewingRound?: boolean;
}

export interface RoundResults {
    date: string;
    results: RoundResult[];
}

export interface AnimatedCountProps {
    isRevealed: boolean;
    tag: Tag;
}

export interface ImageCardProps {
    currentSrc: { url: string; score: number | undefined };
    tagName: string;
    ratingLevel: RatingLevel;
    handleError: () => void;
}

export interface DailyChallenge {
    dailyDate: string;
    dataDate: string;
    tags: [Tag, Tag][];
}

export interface DailyStats {
    totalScore: number;
    totalChallenges: number;
}

export type RatingLevel = "Explicit" | "Questionable" | "Safe" | "No Images";
export type RoundResult = "u" | "i" | "c";
export type GameMode = "Daily" | "Endless";
export type Choice = "left" | "right";
export type Environment = "local" | "preview" | "production";
