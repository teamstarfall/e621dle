import "server-only";

import { TagResponse } from "./interfaces";
import path from "node:path";
import fs, { writeFile } from "node:fs/promises";

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

const currentEnvironment = getEnvironment();

console.log(`Running in ${currentEnvironment} environment.`);

export async function fetchTags() {
    let data: TagResponse;

    if (currentEnvironment === "local") {
        const filePath = path.join(process.cwd(), "resources", "tags.json");
        try {
            const fileContents = await fs.readFile(filePath, "utf8");
            data = JSON.parse(fileContents);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error.code === "ENOENT") {
                console.log("Local tags.json not found, fetching from remote...");
                const response = await fetch(
                    "https://raw.githubusercontent.com/teamstarfall/e621dle/data/resources/tags.dev.json",
                    { cache: "no-store" }
                );
                if (!response.ok) {
                    throw new Error(`Failed to fetch tags.json from fallback URL`);
                }

                await writeFile(filePath, JSON.stringify(JSON.stringify(response.json), null, 2), "utf-8");

                data = await response.json();
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
