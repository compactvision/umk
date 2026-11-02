import DocumentUpload from '../DocumentUpload';
import type { DocumentStepProps } from './Step2Personal';
export default function Step3Academic({
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
            <div className="enrollment-field">
                <label htmlFor="program">
                    Programme d’études <span className="enrollment-required">*</span>
                </label>
                <input
                    id="program"
                    value={formData.program}
                    placeholder="Indiquez le programme ou la filière souhaitée"
                    required
                    aria-invalid={!!errors.program}
                    aria-describedby={`program-help${errors.program ? ' program-error' : ''}`}
                    onChange={(e) => handleFieldChange('program', e.target.value)}
                />
                <p id="program-help" className="enrollment-field-help">
                    Précisez le programme correspondant à votre projet d’études.
                </p>
                {errors.program && (
                    <p id="program-error" className="enrollment-field-error" role="alert">
                        {errors.program}
                    </p>
                )}
            </div>
            {!!requirements.academic_info.length && (
                <>
                    <h3 className="enrollment-subheading">Vos justificatifs académiques</h3>
                    <p className="enrollment-field-help">
                        Ajoutez des documents nets et lisibles. Les pièces obligatoires doivent être transférées avant de continuer.
                    </p>
                </>
            )}
            {requirements.academic_info.map((doc) => (
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
