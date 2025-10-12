import { NextResponse } from "next/server";
import { fetchDailyStats } from "@/app/server";

export async function GET() {
    try {
        return NextResponse.json(await fetchDailyStats());
    } catch (error) {
        console.error("Error fetching daily stats:", error);
        return new Response("Error fetching daily stats", { status: 500 });
    }
}

export async function POST() {
    
}
