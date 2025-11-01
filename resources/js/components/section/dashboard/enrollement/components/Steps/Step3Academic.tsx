// resources/js/pages/enrollment/components/Steps/Step3Academic.tsx (ajustements similaires)

import { AlertCircle, BookOpen, FileText, Upload, X } from 'lucide-react';
import { Requirements } from '../../types';

type Props = {
    formData: any;
    errors: Record<string, string>;
    handleFieldChange: (field: string, value: string) => void;
    requirements: Requirements;
    fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
    handleFileChange: (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: (key: string) => void;
    previews: Record<string, string>;
    focusedField: string | null;
    setFocusedField: (v: string | null) => void;
};

export default function Step3Academic({
    formData,
    errors,
    handleFieldChange,
    requirements,
    fileInputRefs,
    handleFileChange,
    removeFile,
    previews,
    focusedField,
    setFocusedField,
}: Props) {
    return (
        <div className="animate-fadeIn space-y-6">
            {/* Programme */}
            <div className={`group ${focusedField === 'program' ? 'scale-105 transform' : ''} transition-all duration-300`}>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                    <BookOpen className="mr-2 inline h-4 w-4 text-indigo-600" />
                    Programme d'études
                </label>
                <input
                    type="text"
                    className={`w-full rounded-xl border-2 ${errors.program ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} px-4 py-3 transition-all duration-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100`}
                    placeholder="Ex: Informatique"
                    value={formData.program}
                    onChange={(e) => handleFieldChange('program', e.target.value)}
                    onFocus={() => setFocusedField('program')}
                    onBlur={() => setFocusedField(null)}
                />
                {errors.program && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {errors.program}
                    </div>
                )}
            </div>

            {/* Docs académiques dynamiques */}
            {requirements.academic_info.map((doc) => {
                const hasFile = formData.documents[doc.key];
                const preview = previews[doc.key];
                
                return (
                    <div key={doc.key} className={`group ${focusedField === doc.key ? 'scale-105 transform' : ''} transition-all duration-300`}>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            <FileText className="mr-2 inline h-4 w-4 text-purple-600" />
                            {doc.label}
                            {doc.required && <span className="ml-1 text-rose-500">*</span>}
                        </label>

                        {!hasFile && !preview && (
                            <div className="relative">
                                <input
                                    type="file"
                                    id={doc.key}
                                    ref={(el) => (fileInputRefs.current[doc.key] = el)}
                                    accept={doc.accept ?? 'image/*,.pdf'}
                                    className="hidden"
                                    onChange={handleFileChange(doc.key)}
                                />
                                <label
                                    htmlFor={doc.key}
                                    className={`group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 ${errors[doc.key] ? 'border-red-300 bg-red-50' : 'border-dashed border-gray-300 bg-gray-50'} px-4 py-6 transition-all duration-300 hover:border-purple-400 hover:bg-purple-50`}
                                >
                                    <Upload className="h-5 w-5 text-gray-400 transition-colors group-hover:text-purple-600" />
                                    <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">
                                        Cliquez pour télécharger
                                    </span>
                                </label>
                            </div>
                        )}

                        {(hasFile || preview) && (
                            <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-3">
                                {preview && formData.documents[doc.key]?.mime?.startsWith('image/') ? (
                                    <img src={preview} alt={doc.label} className="h-24 w-24 rounded-xl border object-cover shadow-md" />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-white text-xs text-gray-600 shadow-md">
                                        <FileText className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1 truncate text-sm text-gray-700">
                                    {hasFile ? formData.documents[doc.key]?.filename : 'En cours d\'upload...'}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        removeFile(doc.key);
                                        if (fileInputRefs.current[doc.key]) {
                                            fileInputRefs.current[doc.key]!.value = '';
                                        }
                                    }}
                                    className="rounded-lg border border-red-300 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        
                        {errors[doc.key] && (
                            <div className="mt-1 flex items-center text-sm text-red-600">
                                <AlertCircle className="mr-1 h-4 w-4" />
                                {errors[doc.key]}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}