// resources/js/pages/enrollment/components/ProgressHeader.tsx
import { Check, Clock } from 'lucide-react';

export default function ProgressHeader({ step, setAnimateProgress }: { step: number; setAnimateProgress?: (v: boolean) => void }) {
    return (
        <div className="sticky top-0 z-10 border-b border-gray-200/50 bg-white/80 shadow-lg shadow-purple-100/20 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center text-sm font-semibold text-gray-600">
                            <Clock className="mr-2 h-4 w-4 text-indigo-600" />
                            Étape {step} sur 4
                        </span>
                        <span className="flex items-center text-sm font-bold text-indigo-600">{Math.round((step / 4) * 100)}%</span>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="relative h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-700 ease-out"
                            style={{ width: `${(step / 4) * 100}%` }}
                        >
                            <div className="absolute top-0 right-0 h-full w-2 animate-pulse rounded-full bg-white shadow-lg" />
                        </div>
                    </div>
                </div>

                <div className="relative flex items-center justify-between">
                    <div className="absolute top-5 right-0 left-0 h-0.5 bg-gray-200">
                        <div
                            className="relative h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        >
                            <div className="absolute top-1/2 right-0 h-3 w-3 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-white shadow-md" />
                        </div>
                    </div>

                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-all duration-500 ${step >= s ? 'scale-110 bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-300/50' : 'bg-gray-200'}`}
                            >
                                {step > s ? (
                                    <Check className="h-6 w-6 text-white" />
                                ) : (
                                    <span className={`text-base font-bold ${step >= s ? 'text-white' : 'text-gray-400'}`}>{s}</span>
                                )}
                            </div>
                            <span
                                className={`mt-2 hidden text-xs font-medium transition-colors sm:block sm:text-sm ${step >= s ? 'text-indigo-600' : 'text-gray-400'}`}
                            >
                                {['Faculté', 'Infos', 'Académique', 'Paiement'][s - 1]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
