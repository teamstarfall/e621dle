import { NextResponse } from "next/server";
import { fetchDaily } from "@/app/server";
import { getSecondsTillTomorrowUTC } from "@/app/utils/utils";

export async function GET() {
    try {
        const revalidate = getSecondsTillTomorrowUTC();
        return NextResponse.json(await fetchDaily(), {
            headers: {
                "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=3600`,
            },
        });
    } catch (error) {
        console.error("Error fetching daily challenge:", error);
        return new Response("Error fetching daily challenge", { status: 500 });
    }
}
