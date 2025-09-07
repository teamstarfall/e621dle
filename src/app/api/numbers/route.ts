import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export async function GET() {
    const jsonDirectory = path.join(process.cwd(), "resources");
    try {
        const fileContents = await fs.readFile(path.join(jsonDirectory, "tags.json"), "utf8");
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error reading or parsing tags.json:", error);
        return new Response("Error reading or parsing tags.json", { status: 500 });
    }
}
