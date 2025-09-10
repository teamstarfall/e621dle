import "server-only";

import { TagResponse } from "./interfaces";
import path from "node:path";
import fs from "node:fs/promises";

export async function fetchTags() {
    let data: TagResponse;

    if (process.env.NODE_ENV === "development") {
        const filePath = path.join(process.cwd(), "resources", "tags.json");
        const fileContents = await fs.readFile(filePath, "utf8");
        data = JSON.parse(fileContents);
    } else {
        const response = await fetch(
            "https://raw.githubusercontent.com/teamstarfall/e621dle/main/resources/tags.json",
            { cache: "no-store" },
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch tags.json from ${process.env.TAGS_URL}`,
            );
        }
        data = await response.json();
    }

    return data;
}
