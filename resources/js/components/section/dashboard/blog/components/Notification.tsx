import { useEffect, useState } from 'react';
export default function Notification({ success, error }: { success?: string; error?: string }) {
    const [open, setOpen] = useState(Boolean(success || error));
    useEffect(() => {
        if (success || error) {
            setOpen(true);
            const t = setTimeout(() => setOpen(false), 5000);
            return () => clearTimeout(t);
        }
    }, [success, error]);
    if (!open || (!success && !error)) return null;
    const ok = Boolean(success);
    return (
        <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl p-4 shadow-xl backdrop-blur-sm ${ok ? 'bg-gradient-to-r from-emerald-500/90 to-teal-600/90 text-white' : 'bg-gradient-to-r from-red-500/90 to-pink-600/90 text-white'}`}
        >
            <div className="flex-1 font-medium">{success || error}</div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/20">
                ✕
            </button>
        </div>
    );
}
