import { NextResponse } from "next/server";
import { fetchDailyStats, postDailyStats } from "@/app/server";
import { MAX_ROUNDS } from "@/app/constants";

export async function GET() {
    try {
        return NextResponse.json(await fetchDailyStats());
    } catch (error) {
        console.error("Error fetching daily stats:", error);
        return new Response("Error fetching daily stats", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { score } = await request.json();
        if (typeof score !== "number" || score < 0 || score > MAX_ROUNDS) {
            return new Response("Invalid score", { status: 400 });
        }
        const updatedStats = await postDailyStats(score);
        return NextResponse.json(updatedStats);
    } catch (error) {
        console.error("Error posting daily stats:", error);
        return new Response("Error posting daily stats", { status: 500 });
    }
}