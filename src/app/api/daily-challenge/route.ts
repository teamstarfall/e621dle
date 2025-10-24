import { NextResponse } from "next/server";
import { fetchDaily } from "@/app/server";

export async function GET() {
    try {
        return NextResponse.json(await fetchDaily());
    } catch (error) {
        console.error("Error fetching daily challenge:", error);
        return new Response("Error fetching daily challenge", { status: 500 });
    }
}