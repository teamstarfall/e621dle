import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { Tag, TagResponse } from "@/app/interfaces";

export async function GET(req: NextRequest) {
    const jsonDirectory = path.join(process.cwd(), "resources");
    try {
        const fileContents = await fs.readFile(path.join(jsonDirectory, "tags.json"), "utf8");
        const data: TagResponse = JSON.parse(fileContents);

        const searchParams = req.nextUrl.searchParams;
        const ratings = searchParams.get("ratings")?.split(",") || [];

        if (ratings.length > 0) {
            const filteredTags: Tag[] = [];
            for (const tag of data.tags) {
                if (ratings.includes(tag.rating)) {
                    filteredTags.push(tag);
                }
            }
            data.tags = filteredTags;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error reading or parsing tags.json:", error);
        return new Response("Error reading or parsing tags.json", { status: 500 });
    }
}
