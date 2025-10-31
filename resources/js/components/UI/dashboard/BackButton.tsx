import React from "react";

export default function BackButton({ label = "Retour" }: { label?: string }) {
    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back(); // ✅ utilise l'historique du navigateur
        } else {
            window.location.href = "/"; // fallback vers l'accueil
        }
    };

    return (
        <button 
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none rounded-lg font-semibold text-base cursor-pointer transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md active:shadow-purple-500/20 mb-4"
        >
            <span className="text-xl transition-transform duration-300 group-hover:-translate-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="fill-current">
                    <path d="M2.614 5.426A1.5 1.5 0 0 1 4 4.5h10a7.5 7.5 0 1 1 0 15H5a1.5 1.5 0 0 1 0-3h9a4.5 4.5 0 1 0 0-9H7.621l.94.94a1.5 1.5 0 0 1-2.122 2.12l-3.5-3.5a1.5 1.5 0 0 1-.325-1.634"/>
                </svg>
            </span>
            <span className="tracking-wide">{label}</span>
        </button>
    );
}