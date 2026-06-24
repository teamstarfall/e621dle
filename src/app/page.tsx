import { Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Game from "./components/Game";
import Spinner from "./components/Spinner";
import { getDaily } from "./fetch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Error() {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center gap-2 text-center">
            <span>Something went wrong.</span>
            <span className="text-sm text-neutral-500">
                Reach out on{" "}
                <a
                    className="underline"
                    href="http://github.com/teamstarfall/e621dle"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GitHub
                </a>
                {", "}
                <a className="underline" href="http://twitter.com/angelolz1" target="_blank" rel="noopener noreferrer">
                    Twitter
                </a>
                {", or "}
                <a
                    className="underline"
                    href="https://bsky.app/profile/angelolz.one"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Bluesky
                </a>
                .
            </span>
        </div>
    );
}

function Loading() {
    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <Spinner />
        </div>
    );
}

export default function Home() {
    const dailyChallenge = getDaily();

    return (
        <ErrorBoundary fallback={<Error />}>
            <Suspense fallback={<Loading />}>
                <Game dailyChallenge={dailyChallenge} />
            </Suspense>
        </ErrorBoundary>
    );
}
