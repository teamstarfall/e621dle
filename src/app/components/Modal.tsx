import { ModalProps } from "../interfaces";

export default function Modal({ isRevealed, onClose, children }: ModalProps) {
    if (!isRevealed) {
        return null;
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/65 z-50 animate-fade-in animate">
            <div className="bg-[#1f3c67] rounded-lg border-1 shadow-2xl max-w-md p-6 relative animate-fly-fade-in text-center">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white">
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {children}
            </div>
        </div>
    );
}
