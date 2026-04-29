import "server-only";

import { fetchDaily } from "./server";

export async function getDaily() {
    return await fetchDaily();
}
