import "server-only";

import { DailyChallenge, Tag, TagResponse } from "./interfaces";
import { RedisClientType, createClient } from "redis";
import { mulberry32, xmur3 } from "./utils/rng";
import { MAX_POST_DIFFERENCE_DAILY, MAX_ROUNDS } from "./constants";
import { decode } from "@msgpack/msgpack";
import { getEnvironment } from "./utils/utils";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

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

const currentEnvironment = getEnvironment();

function getCurrentUtcDate() {
    return new Date().toISOString().split("T")[0];
}

export async function fetchTags() {
    const tagName = currentEnvironment === "production" ? "tags" : "tags.dev";

    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

    const bucketUrl =
        process.env.NEXT_PUBLIC_DATA_BUCKET_URL ||
        process.env.DATA_BUCKET_URL ||
        (R2_BUCKET_NAME ? `https://${R2_BUCKET_NAME}.starfall.team` : undefined);
    if (bucketUrl) {
        try {
            const url = `${bucketUrl}/resources/${tagName}.min.json`;
            console.log("Loading data from: " + url);
            const response = await fetch(url, { cache: "no-store" });
            if (response.ok) {
                const minifiedJson = await response.arrayBuffer();
                return decode(new Uint8Array(minifiedJson)) as TagResponse;
            }
            console.warn(`Failed to fetch from bucket URL: ${url}`);
        } catch (fetchError) {
            console.warn(`Error fetching from bucket URL:`, fetchError);
        }
    }

    if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME) {
        try {
            const s3 = new S3Client({
                region: "auto",
                endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
                credentials: {
                    accessKeyId: R2_ACCESS_KEY_ID,
                    secretAccessKey: R2_SECRET_ACCESS_KEY,
                },
            });

            const command = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: `resources/${tagName}.min.json`,
            });

            const s3Response = await s3.send(command);
            if (s3Response.Body) {
                const bodyContents = await s3Response.Body.transformToByteArray();
                return decode(new Uint8Array(bodyContents)) as TagResponse;
            }
        } catch (s3Error) {
            console.error("Failed to fetch tags from R2 bucket via S3 client:", s3Error);
        }
    }

    throw new Error(
        `Failed to fetch tags.json for environment '${currentEnvironment}'. Please check that your bucket URL or R2 credentials are set.`
    );
}

export async function fetchDaily() {
    const redis = await getRedisClient();
    const value = await redis.get(getKey("currentDaily"));
    const currentUtcDate = getCurrentUtcDate();
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
    const currentUtcDate = getCurrentUtcDate();

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
    const currentUtcDate = getCurrentUtcDate();
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
    const currentUtcDate = getCurrentUtcDate();
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
