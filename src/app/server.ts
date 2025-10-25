import "server-only";

import { DailyChallenge, Tag, TagResponse } from "./interfaces";
import path from "node:path";
import fs, { writeFile } from "node:fs/promises";
import { RedisClientType, createClient } from "redis";
import { mulberry32, xmur3 } from "./utils/rng";
import { MAX_POST_DIFFERENCE_DAILY, MAX_ROUNDS } from "./constants";
import { decode } from "@msgpack/msgpack";
import { getEnvironment } from "./utils/utils";

let redisClient: RedisClientType;

async function getRedisClient() {
    if (!redisClient) {
        redisClient = createClient({ url: process.env.REDIS_URL });
        await redisClient.connect();
    } else if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    return redisClient;
}

function getKey(key: string): string {
    return `${key}${currentEnvironment !== "production" ? `_${currentEnvironment}` : ""}`;
}

const currentUtcDate = new Date().toISOString().split("T")[0];
const currentEnvironment = getEnvironment();

export async function fetchTags() {
    if (currentEnvironment === "local") {
        const filePath = path.join(process.cwd(), "resources", "tags.dev.json");
        try {
            const fileContents = await fs.readFile(filePath, "utf8");
            return JSON.parse(fileContents);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;

            console.log("Local tags.json not found, fetching from remote...");
            const response = await fetch(
                "https://raw.githubusercontent.com/teamstarfall/e621dle/refs/heads/data/resources/tags.dev.json",
                { cache: "no-store" }
            );
            if (!response.ok) {
                throw new Error(`Failed to fetch tags.dev.json from fallback URL`);
            }

            const data = await response.json();
            await writeFile(filePath, JSON.stringify(data, null, 2));
            return data;
        }
    }

    const tagName = currentEnvironment === "production" ? "tags" : "tags.dev";
    const url = `https://raw.githubusercontent.com/teamstarfall/e621dle/data/resources/${tagName}.min.json`;

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Failed to fetch tags.json from ${url}`);
    }

    const minifiedJson = await response.arrayBuffer();
    return decode(new Uint8Array(minifiedJson)) as TagResponse;
}

export async function fetchDaily() {
    const redis = await getRedisClient();
    const value = await redis.get(getKey("currentDaily"));
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
    const redis = await getRedisClient();
    const value = await redis.get(getKey("dailyStats"));

    const resetAndReturnStats = async () => {
        const emptyData = {
            date: currentUtcDate,
            totalScore: 0,
            totalChallenges: 0,
        };
        await redis.set(getKey("dailyStats"), JSON.stringify(emptyData));
        return emptyData;
    };

    if (!value) {
        return await resetAndReturnStats();
    }

    const stats = JSON.parse(value);

    if (stats.date !== currentUtcDate) {
        return await resetAndReturnStats();
    }

    return stats;
}

export async function postDailyStats(score: number) {
    const redis = await getRedisClient();
    const stats = await fetchDailyStats();
    stats.totalScore += score;
    stats.totalChallenges += 1;
    await redis.set(getKey("dailyStats"), JSON.stringify(stats));
    return stats;
}

async function createNewDaily() {
    const redis = await getRedisClient();
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

    await redis.set(getKey("currentDaily"), JSON.stringify(data));
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
            .filter(
                ({ tag, idx }) =>
                    idx !== firstIdx && !used.has(idx) && Math.abs(firstTag.count - tag.count) < MAX_POST_DIFFERENCE_DAILY
            );

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
