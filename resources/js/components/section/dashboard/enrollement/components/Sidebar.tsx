// resources/js/pages/enrollment/components/Sidebar.tsx
import { Award, Check, ChevronDown, Globe, TrendingUp, Users } from 'lucide-react';
import { Section, SectionField } from '../types';

export default function Sidebar({
    sections,
    expandedSections,
    setExpandedSections,
    isFieldCompleted,
    percentage,
    totalFields,
    completedFields,
    animateProgress,
}: {
    sections: Section[];
    expandedSections: Record<number, boolean>;
    setExpandedSections: (v: Record<number, boolean>) => void;
    isFieldCompleted: (f: SectionField) => boolean;
    percentage: number;
    totalFields: number;
    completedFields: number;
    animateProgress: boolean;
}) {
    return (
        <div className="lg:col-span-1">
            <div className="sticky top-32">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl shadow-purple-100/30 backdrop-blur-sm">
                    <div className="mb-6">
                        <h3 className="mb-2 flex items-center text-xl font-bold text-gray-800">
                            <TrendingUp className="mr-2 h-5 w-5 text-indigo-600" />
                            Progression
                        </h3>
                        <p className="text-sm text-gray-600">
                            {completedFields}/{totalFields} champs complétés
                        </p>
                    </div>

                    <div className="mb-6">
                        <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
                            <div
                                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-500 ${animateProgress ? 'animate-pulse' : ''}`}
                                style={{ width: `${percentage}%` }}
                            >
                                <div className="absolute top-0 right-0 h-full w-2 animate-pulse rounded-full bg-white shadow-lg" />
                            </div>
                        </div>
                        <p className="mt-2 flex items-center justify-end text-right text-sm font-bold text-indigo-600">
                            <TrendingUp className="mr-1 h-4 w-4" />
                            {percentage}%
                        </p>
                    </div>

                    <div className="space-y-3">
                        {sections.map((section, idx) => {
                            const completed = section.fields.filter(isFieldCompleted).length;
                            const Icon = section.icon;
                            const isExpanded = expandedSections[idx];

                            return (
                                <div
                                    key={idx}
                                    className={`overflow-hidden rounded-2xl border ${isExpanded ? 'border-indigo-200 shadow-md' : 'border-gray-200'} transition-all duration-300`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setExpandedSections({ ...expandedSections, [idx]: !expandedSections[idx] })}
                                        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-lg p-2 ${isExpanded ? 'bg-indigo-100' : 'bg-gray-100'} transition-colors`}>
                                                <Icon className={`h-5 w-5 ${isExpanded ? 'text-indigo-600' : 'text-gray-600'}`} />
                                            </div>
                                            <span className={`text-sm font-semibold ${isExpanded ? 'text-indigo-600' : 'text-gray-800'}`}>
                                                {section.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold ${isExpanded ? 'text-indigo-600' : 'text-gray-600'}`}>
                                                {completed}/{section.fields.length}
                                            </span>
                                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="space-y-2 px-4 pb-4">
                                            {section.fields.map((field, fidx) => {
                                                const FieldIcon = field.icon;
                                                const done = isFieldCompleted(field);

                                                return (
                                                    <div
                                                        key={fidx}
                                                        className={`flex items-center gap-3 rounded-lg p-2 transition-all duration-300 ${done ? 'bg-green-50' : 'bg-gray-50'}`}
                                                    >
                                                        <div
                                                            className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${done ? 'bg-green-500 shadow-md' : 'bg-gray-300'}`}
                                                        >
                                                            {done ? (
                                                                <Check className="h-4 w-4 text-white" />
                                                            ) : (
                                                                <FieldIcon className="h-3 w-3 text-gray-500" />
                                                            )}
                                                        </div>
                                                        <span
                                                            className={`text-xs font-medium transition-colors ${done ? 'text-green-700' : 'text-gray-600'}`}
                                                        >
                                                            {field.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                        <div className="flex items-start">
                            <div className="mr-3 rounded-full bg-indigo-100 p-2">
                                <Award className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-indigo-800">Avantages de l'inscription</p>
                                <ul className="mt-1 space-y-1 text-xs text-indigo-600">
                                    <li className="flex items-center">
                                        <Check className="mr-1 h-3 w-3" />
                                        Accès à tous les cours
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-1 h-3 w-3" />
                                        Support personnalisé
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-1 h-3 w-3" />
                                        Certificat de fin d'études
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-center">
                            <Users className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                            <p className="text-xs font-medium text-blue-600">+2000 étudiants</p>
                        </div>
                        <div className="rounded-xl bg-green-50 p-3 text-center">
                            <Globe className="mx-auto mb-1 h-5 w-5 text-green-600" />
                            <p className="text-xs font-medium text-green-600">Formation internationale</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
