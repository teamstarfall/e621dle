import { Environment } from "../interfaces";

export function getEnvironment(): Environment {
    if (process.env.VERCEL_ENV === "production") {
        return "production";
    } else if (process.env.VERCEL_ENV === "preview") {
        return "preview";
    } else {
        return "local";
    }
}

export function getSecondsTillTomorrowUTC(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);

    return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
}
