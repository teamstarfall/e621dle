import { ModalProps } from "../interfaces";

export default function Modal({
    isRevealed,
    onClose,
    children,
}: ModalProps) {
    if (!isRevealed) {
        return null;
    }


    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 border-1">
        <div className="bg-[#1f3c67] rounded-lg border-1 shadow-lg p-6 max-w-md w-full relative">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
            </button>
            {children}
        </div>
    </div>
    );

}