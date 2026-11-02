import type { ChangeEvent } from 'react';
import type { FormData, Requirements } from '../../types';
import DocumentUpload from '../DocumentUpload';
export type DocumentStepProps = {
    formData: FormData;
    errors: Record<string, string>;
    handleFieldChange: (field: keyof FormData, value: string) => void;
    requirements: Requirements;
    handleFileChange: (key: string) => (event: ChangeEvent<HTMLInputElement>) => void;
    removeFile: (key: string) => void;
    previews: Record<string, string>;
    uploadingKeys: string[];
};
export default function Step2Personal({
    formData,
    errors,
    handleFieldChange,
    requirements,
    handleFileChange,
    removeFile,
    previews,
    uploadingKeys,
}: DocumentStepProps) {
    return (
        <div className="enrollment-fields">
            <div className="enrollment-info">Vos coordonnées sont préremplies depuis votre compte. Vérifiez-les avant de continuer.</div>
            {[
                { key: 'name' as const, label: 'Nom complet', type: 'text', autoComplete: 'name', placeholder: 'Nom, postnom et prénom' },
                { key: 'email' as const, label: 'Adresse email', type: 'email', autoComplete: 'email', placeholder: 'vous@exemple.com' },
            ].map(({ key, label, ...attributes }) => (
                <div className="enrollment-field" key={key}>
                    <label htmlFor={key}>
                        {label}
                        <span className="enrollment-required">*</span>
                    </label>
                    <input
                        {...attributes}
                        id={key}
                        value={formData[key]}
                        required
                        aria-invalid={!!errors[key]}
                        aria-describedby={errors[key] ? `${key}-error` : undefined}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                    />
                    {errors[key] && (
                        <p id={`${key}-error`} className="enrollment-field-error" role="alert">
                            {errors[key]}
                        </p>
                    )}
                </div>
            ))}
            {!!requirements.personal_info.length && <h3 className="enrollment-subheading">Vos pièces d’identité</h3>}
            {requirements.personal_info.map((doc) => (
                <DocumentUpload
                    key={doc.key}
                    doc={doc}
                    document={formData.documents[doc.key]}
                    preview={previews[doc.key]}
                    uploading={uploadingKeys.includes(doc.key)}
                    error={errors[doc.key]}
                    onChange={handleFileChange(doc.key)}
                    onRemove={() => removeFile(doc.key)}
                />
            ))}
        </div>
    );
}
