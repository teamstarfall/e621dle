import { DailyStats, TagResponse } from "./interfaces";

export async function getTags() {
    const response = await fetch("/api/posts");
    const body = (await response.json()) as TagResponse;
    return body;
}

export async function getDailyStats() {
    const response = await fetch("/api/daily-stats");
    const body = (await response.json()) as DailyStats;
    return body;
}
