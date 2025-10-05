import { Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Game from "./components/Game";
import Spinner from "./components/Spinner";
import { getDaily, getDailyStats, getTags } from "./fetch";

function Error() {
    return <div className="w-screen h-screen flex items-center justify-center">Something went wrong.</div>;
}

function Loading() {
    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <Spinner />
        </div>
    );
}

export default function Home() {
    const posts = getTags();
    const dailyChallenge = getDaily();
    const dailyStats = getDailyStats();

    return (
        <ErrorBoundary fallback={<Error />}>
            <Suspense fallback={<Loading />}>
                <Game posts={posts} dailyChallenge={dailyChallenge} dailyStats={dailyStats} />
            </Suspense>
        </ErrorBoundary>
    );
}
