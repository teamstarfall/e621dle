import { useCallback, useSyncExternalStore, type SetStateAction, type Dispatch } from "react";
import {
    SETTINGS_ADULT_WARNING,
    SETTINGS_CHARACTER_TAGS_ONLY,
    SETTINGS_PAUSE_BEFORE_NEXT,
    SETTINGS_RATING_LEVEL,
} from "./constants";
import { RatingLevel } from "./interfaces";

function subscribeToLocalStorage(key: string, onStoreChange: () => void) {
    function onStorage(ev: StorageEvent) {
        if (ev.key !== key) {
            return;
        }

        onStoreChange();
    }

    addEventListener("storage", onStorage);
    return () => removeEventListener("storage", onStorage);
}
/**
 * Subscribes to a key in localStorage
 * @param key Key to subscribe to
 * @param defaultValue Default value both for SSR and if there is no value in localStorage
 * @param {(value: T) => string}[serialize=JSON.stringify] Serialization function to apply to the value before storing
 * @param {(value: string) => T}[deserialize=JSON.parse] Deserialization function to parse the value from local storage
 * @returns A tuple identical to that of `useState<T>`
 */
export function useLocalStorage<T extends string | number | boolean>(
    key: string,
    defaultValue: T,
    serialize: (value: T) => string = JSON.stringify,
    deserialize: (value: string) => T = JSON.parse
) {
    // if we don't memoize these functions react will re-subscribe every render

    const subscribe = useCallback((onStoreChange: () => void) => subscribeToLocalStorage(key, onStoreChange), [key]);

    const snapshot = useCallback(() => {
        const snapshot = localStorage.getItem(key);
        if (snapshot === null) {
            return defaultValue;
        }

        return deserialize(snapshot);
    }, [key, deserialize, defaultValue]);

    const serverSnapshot = useCallback(() => null, []);

    const value = useSyncExternalStore<T | null>(subscribe, snapshot, serverSnapshot);

    const updater = useCallback<Dispatch<SetStateAction<T>>>(
        (next: T | ((prev: T) => T)) => {
            const oldValue = serialize(value ?? defaultValue);
            const newValue = serialize(typeof next === "function" ? next(value ?? defaultValue) : next);

            localStorage.setItem(key, newValue);

            // we have to manually trigger a storage event because the browser
            // won't fire one for a localStorage event coming from the same
            // tab
            window.dispatchEvent(
                new StorageEvent("storage", {
                    key,
                    newValue,
                    oldValue,
                })
            );
        },
        [key, serialize, value, defaultValue]
    );

    return [value, updater] as const;
}

export function useSettings() {
    const [showAdultWarning, setShowAdultWarning] = useLocalStorage<boolean>(SETTINGS_ADULT_WARNING, true);

    const [ratingLevel, setRatingLevel] = useLocalStorage<RatingLevel>(
        SETTINGS_RATING_LEVEL,
        "Safe",
        (v) => v,
        (v) => v as RatingLevel
    );

    const [characterTagsOnly, setCharacterTagsOnly] = useLocalStorage<boolean>(SETTINGS_CHARACTER_TAGS_ONLY, false);

    const [pause, setPause] = useLocalStorage<boolean>(SETTINGS_PAUSE_BEFORE_NEXT, false);

    return {
        showAdultWarning,
        setShowAdultWarning,
        ratingLevel,
        setRatingLevel,
        characterTagsOnly,
        setCharacterTagsOnly,
        pause,
        setPause,
    };
}
