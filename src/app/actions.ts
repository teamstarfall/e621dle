export async function postDailyStats(score: number) {
    console.log("post daily stats called");
    if (typeof window !== "undefined") {
        const response = await fetch("/api/daily-stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to post daily stats");
        }
        return response.json();
    }
}
