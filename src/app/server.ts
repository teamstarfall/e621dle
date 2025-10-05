import "server-only";

import { DailyChallenge, Tag, TagResponse } from "./interfaces";
import path from "node:path";
import fs, { writeFile } from "node:fs/promises";
import { createClient } from "redis";
import { mulberry32, xmur3 } from "./utils/rng";
import { MAX_ROUNDS } from "./constants";

type Environment = "local" | "preview" | "production";

function getEnvironment(): Environment {
    if (process.env.VERCEL_ENV === "production") {
        return "production";
    } else if (process.env.VERCEL_ENV === "preview") {
        return "preview";
    } else {
        return "local";
    }
}

const currentUtcDate = new Date().toISOString().split("T")[0];
const currentEnvironment = getEnvironment();
const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export async function fetchTags() {
    let data: TagResponse;

    if (currentEnvironment === "local") {
        const filePath = path.join(process.cwd(), "resources", "tags.dev.json");
        try {
            const fileContents = await fs.readFile(filePath, "utf8");
            data = JSON.parse(fileContents);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error.code === "ENOENT") {
                console.log("Local tags.json not found, fetching from remote...");
                const response = await fetch(
                    "https://raw.githubusercontent.com/teamstarfall/e621dle/refs/heads/data/resources/tags.dev.json",
                    { cache: "no-store" }
                );
                if (!response.ok) {
                    throw new Error(`Failed to fetch tags.dev.json from fallback URL`);
                }

                data = await response.json();
                await writeFile(filePath, JSON.stringify(data, null, 2));
            } else {
                throw error;
            }
        }
    } else if (currentEnvironment === "preview" || currentEnvironment === "production") {
        const url = `https://raw.githubusercontent.com/teamstarfall/e621dle/data/resources/${
            currentEnvironment === "production" ? "tags" : "tags.dev"
        }.json`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to fetch tags.json from ${url}`);
        }
        data = await response.json();
    } else {
        throw new Error("Unknown environment");
    }

    return data;
}

export async function fetchDaily() {
    const value = await redis.get("currentDaily");
    if (!value) {
        const dailyData = createNewDaily();
        return dailyData;
    }

    const data: DailyChallenge = JSON.parse(value);
    if (data.dailyDate !== currentUtcDate) {
        const dailyData = createNewDaily();
        return dailyData;
    }

    return data;
}

export async function fetchDailyStats() {
    return {
        totalScore: 0,
        totalChallenges: 0,
    };
}

async function createNewDaily() {
    const posts = await fetchTags();
    if (!posts || !posts.tags) {
        throw new Error("failed to fetch tags");
    }

    const dailyTags = generateDailyPosts(posts.tags);
    const data: DailyChallenge = {
        dailyDate: currentUtcDate,
        dataDate: posts.date,
        tags: dailyTags,
    };

    redis.set("currentDaily", JSON.stringify(data));
    return data;
}

function generateDailyPosts(tags: Tag[]) {
    const seed = xmur3(currentUtcDate)();
    const rand = mulberry32(seed);

    const pairs: [Tag, Tag][] = [];
    const used = new Set<number>();

    while (pairs.length < MAX_ROUNDS && used.size < tags.length) {
        const firstIdx = Math.floor(rand() * tags.length);
        if (used.has(firstIdx)) continue;

        const firstTag = tags[firstIdx];

        // filter valid candidates
        const candidates = tags
            .map((tag, idx) => ({ tag, idx }))
            .filter(({ tag, idx }) => idx !== firstIdx && !used.has(idx) && Math.abs(firstTag.count - tag.count) < 40000);

        if (candidates.length === 0) {
            // no valid pair for this firstTag, skip
            used.add(firstIdx);
            continue;
        }

        const { idx: secondIdx } = candidates[Math.floor(rand() * candidates.length)];
        pairs.push([firstTag, tags[secondIdx]]);
        used.add(firstIdx);
        used.add(secondIdx);
    }

    return pairs;
}
