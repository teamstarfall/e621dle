import Image from "next/image";

interface ImageViewerProps {
    isRevealed: boolean;
    onClose: () => void;
    imageUrl: string;
    tagName: string;
}

export default function ImageViewer({ isRevealed, onClose, imageUrl, tagName }: ImageViewerProps) {
    if (!isRevealed) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/65 z-50 animate-fade-in animate"
            onClick={onClose}
        >
            <div className="relative w-full h-full max-w-4xl max-h-4xl p-4">
                <div className="bg-[#1f3c67] rounded-lg border-1 shadow-2xl p-4 relative animate-fly-fade-in text-center flex flex-col gap-4 h-full">
                    <div className="relative h-full">
                        <Image
                            key={imageUrl}
                            src={imageUrl}
                            alt={tagName}
                            unoptimized
                            fill
                            className="object-contain rounded-md"
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
