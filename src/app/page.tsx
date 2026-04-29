import { Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Game from "./components/Game";
import Spinner from "./components/Spinner";
import { getDaily } from "./fetch";

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
    const dailyChallenge = getDaily();

    return (
        <ErrorBoundary fallback={<Error />}>
            <Suspense fallback={<Loading />}>
                <Game dailyChallenge={dailyChallenge} />
            </Suspense>
        </ErrorBoundary>
    );
}
