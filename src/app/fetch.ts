import { TagResponse } from "./interfaces";
import { fetchTags } from "./server";

export async function fetchPosts() {
    if (typeof window === "undefined") {
        // if this is being run on SSR can't fetch from the API route
        // so we just mimick the behavior of the API route
        return await fetchTags();
    } else {
        const response = await fetch("/api/posts");
        const body = (await response.json()) as TagResponse;
        return body;
    }
}
