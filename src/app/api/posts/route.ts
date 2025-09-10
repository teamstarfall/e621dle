import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { TagResponse } from "@/app/interfaces";

export async function GET() {
    try {
        let data: TagResponse;

        if (process.env.NODE_ENV === "development") {
            const filePath = path.join(process.cwd(), "resources", "tags.json");
            const fileContents = await fs.readFile(filePath, "utf8");
            data = JSON.parse(fileContents);
        } else {
            const response = await fetch(
                "https://raw.githubusercontent.com/teamstarfall/e621dle/main/resources/tags.json",
                { cache: "no-store" }
            );
            if (!response.ok) {
                throw new Error(`Failed to fetch tags.json from ${process.env.TAGS_URL}`);
            }
            data = await response.json();
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching tags.json:", error);
        return new Response("Error fetching tags.json", { status: 500 });
    }
}
