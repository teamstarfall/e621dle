import { DailyChallenge, DailyStats, TagResponse } from "./interfaces";
import { fetchDaily, fetchDailyStats, fetchTags } from "./server";

export async function getTags() {
    if (typeof window === "undefined") {
        // if this is being run on SSR can't fetch from the API route
        // so we just mimick the behavior of the API route
        return await fetchTags();
    } else {
        const response = await fetch("/api/posts");
        const body = (await response.json()) as TagResponse;
        return body;
    }
}

export async function getDaily() {
    if (typeof window === "undefined") {
        return await fetchDaily();
    } else {
        const response = await fetch("/api/daily-challenge");
        const body = (await response.json()) as DailyChallenge;
        return body;
    }
}

export async function getDailyStats() {
    if (typeof window === "undefined") {
        return await fetchDailyStats();
    } else {
        const response = await fetch("/api/daily-stats");
        const body = (await response.json()) as DailyStats;
        return body;
    }
}
