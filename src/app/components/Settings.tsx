import { useEffect, useState } from "react";
import { RatingLevel, SettingsProps } from "../interfaces";
import { SETTINGS_CHARACTER_TAGS_ONLY, SETTINGS_RATING_LEVEL } from "../constants";

export default function Settings({ ratingLevel, setRatingLevel, characterTagsOnly, toggleCharacters }: SettingsProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        toggleCharacters(isChecked);
        setShowTooltip(true);
        setTimeout(() => {
            setShowTooltip(false);
        }, 3000); // Tooltip disappears after 3 seconds
    };

    useEffect(() => {
        localStorage.setItem(SETTINGS_RATING_LEVEL, ratingLevel);
        localStorage.setItem(SETTINGS_CHARACTER_TAGS_ONLY, characterTagsOnly.toString());
    }, [ratingLevel, characterTagsOnly]);
    return (
        <div className="flex items-center flex-col md:items-end mt-4 md:absolute md:top-4 md:right-4 md:mt-0">
            <div className="flex flex-row">
                <label htmlFor="rating-select" className="text-center whitespace-nowrap mr-2">
                    Show Ratings
                </label>
                <select
                    id="rating-select"
                    value={ratingLevel || "S"}
                    onChange={(e) => setRatingLevel(e.target.value as RatingLevel)}
                    className="bg-[#071e32] border border-gray-600 text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full px-2 py-1"
                >
                    <option style={{ fontFamily: "Inter" }} value="No Images">
                        No Images
                    </option>
                    <option value="Safe">Safe</option>
                    <option value="Questionable">Questionable</option>
                    <option value="Explicit">Explicit</option>
                </select>
            </div>
            <div className="relative flex items-center mt-2">
                <label htmlFor="character-toggle" className="whitespace-nowrap mr-2">
                    Characters Only
                </label>
                <input
                    type="checkbox"
                    id="character-toggle"
                    checked={characterTagsOnly || false}
                    onChange={handleToggle}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {showTooltip && (
                    <div className="absolute bottom-full ml-2 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap">
                        Will apply on next round.
                    </div>
                )}
            </div>
        </div>
    );
}
