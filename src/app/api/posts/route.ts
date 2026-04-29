import { NextResponse } from "next/server";
import { fetchTags } from "@/app/server";
import { unstable_cache } from "next/cache";
import { getEnvironment, getSecondsTillTomorrowUTC } from "@/app/utils/utils";

export async function GET() {
    try {
        const revalidate = getSecondsTillTomorrowUTC();
        const getCachedTags = unstable_cache(async () => fetchTags(), ["tags", getEnvironment()], {
            revalidate,
        });
        return NextResponse.json(await getCachedTags(), {
            headers: {
                "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=3600`,
            },
        });
    } catch (error) {
        console.error("Error fetching tags.json:", error);
        return new Response("Error fetching tags.json", { status: 500 });
    }
}
