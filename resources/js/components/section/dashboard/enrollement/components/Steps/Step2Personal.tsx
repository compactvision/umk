// resources/js/pages/enrollment/components/steps/Step2Personal.tsx
import { AlertCircle, FileText, Mail, Upload, User } from 'lucide-react';
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

export default function Step2Personal({
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
            {/* Nom */}
            <div className={`group ${focusedField === 'name' ? 'scale-105 transform' : ''} transition-all duration-300`}>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                    <User className="mr-2 inline h-4 w-4 text-indigo-600" />
                    Nom complet
                </label>
                <input
                    type="text"
                    className={`w-full rounded-xl border-2 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} px-4 py-3 transition-all duration-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100`}
                    placeholder="Jean Dupont"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                />
                {errors.name && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {errors.name}
                    </div>
                )}
            </div>

            {/* Email */}
            <div className={`group ${focusedField === 'email' ? 'scale-105 transform' : ''} transition-all duration-300`}>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                    <Mail className="mr-2 inline h-4 w-4 text-purple-600" />
                    Adresse email
                </label>
                <input
                    type="email"
                    className={`w-full rounded-xl border-2 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} px-4 py-3 transition-all duration-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100`}
                    placeholder="jean.dupont@email.com"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                />
                {errors.email && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {errors.email}
                    </div>
                )}
            </div>

            {/* Docs personnels dynamiques */}
            {requirements.personal_info.map((doc) => (
                <div key={doc.key} className={`group ${focusedField === doc.key ? 'scale-105 transform' : ''} transition-all duration-300`}>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                        <FileText className="mr-2 inline h-4 w-4 text-pink-600" />
                        {doc.label}
                        {doc.required && <span className="ml-1 text-rose-500">*</span>}
                    </label>

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
                            className={`group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 ${errors[doc.key] ? 'border-red-300 bg-red-50' : 'border-dashed border-gray-300 bg-gray-50'} px-4 py-6 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50`}
                        >
                            <Upload className="h-5 w-5 text-gray-400 transition-colors group-hover:text-indigo-600" />
                            <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">
                                {formData.documents[doc.key] ? 'Changer le fichier' : 'Cliquez pour télécharger'}
                            </span>
                        </label>
                    </div>

                    {/* Preview */}
                    {previews[doc.key] && (
                        <div className="mt-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                            {formData.documents[doc.key]?.type?.startsWith('image/') ? (
                                <img src={previews[doc.key]} alt={doc.label} className="h-24 w-24 rounded-xl border object-cover shadow-md" />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-white text-xs text-gray-600 shadow-md">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1 truncate text-sm text-gray-700">{(formData.documents[doc.key] as File)?.name}</div>
                            <button
                                type="button"
                                onClick={() => removeFile(doc.key)}
                                className="rounded-lg border border-gray-300 p-2 text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                <AlertCircle className="h-4 w-4" />
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
            ))}
        </div>
    );
}
