import "server-only";

import { TagResponse } from "./interfaces";
import path from "node:path";
import fs, { writeFile } from "node:fs/promises";

export async function fetchTags() {
    let data: TagResponse;

    if (process.env.NODE_ENV === "development") {
        const filePath = path.join(process.cwd(), "resources", "tags.json");
        try {
            const fileContents = await fs.readFile(filePath, "utf8");
            data = JSON.parse(fileContents);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error.code === "ENOENT") {
                console.log("Local tags.json not found, fetching from remote...");
                const response = await fetch(
                    "https://raw.githubusercontent.com/teamstarfall/e621dle/data/resources/tags.json",
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
    } else {
        const response = await fetch("https://raw.githubusercontent.com/teamstarfall/e621dle/data/resources/tags.json", {
            cache: "no-store",
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch tags.json from ${process.env.TAGS_URL}`);
        }
        data = await response.json();
    }

    return data;
}
