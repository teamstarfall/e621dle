import { NextResponse } from "next/server";
import { fetchTags } from "@/app/server";

export async function GET() {
    try {
        return NextResponse.json(await fetchTags());
    } catch (error) {
        console.error("Error fetching tags.json:", error);
        return new Response("Error fetching tags.json", { status: 500 });
    }
}
