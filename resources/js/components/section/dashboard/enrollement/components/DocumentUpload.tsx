import { CheckCircle2, FileText, LoaderCircle, Upload, X } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { DocumentMeta, RequirementDoc } from '../types';
export default function DocumentUpload({
    doc,
    document,
    preview,
    uploading,
    error,
    onChange,
    onRemove,
}: {
    doc: RequirementDoc;
    document?: DocumentMeta;
    preview?: string;
    uploading: boolean;
    error?: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}) {
    const id = `document-${doc.key}`;
    return (
        <div className="enrollment-document">
            <label htmlFor={id}>
                {doc.label} <span className="enrollment-field-tag">{doc.required ? 'Obligatoire' : 'Facultatif'}</span>
            </label>
            <div className={`enrollment-upload ${document ? 'is-uploaded' : ''} ${error ? 'has-error' : ''}`}>
                {uploading ? (
                    <div className="enrollment-upload-status" role="status">
                        <LoaderCircle size={24} className="animate-spin" />
                        <span>Transfert en cours…</span>
                    </div>
                ) : document ? (
                    <div className="enrollment-upload-file">
                        {preview && document.mime.startsWith('image/') ? <img src={preview} alt={`Aperçu : ${doc.label}`} /> : <FileText size={28} />}
                        <div>
                            <strong>{document.filename}</strong>
                            <small>
                                <CheckCircle2 size={13} /> Fichier ajouté · {(document.size_bytes / 1024 / 1024).toFixed(1)} Mo
                            </small>
                        </div>
                        <button type="button" onClick={onRemove} aria-label={`Retirer ${doc.label}`}>
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <label htmlFor={id} className="enrollment-upload-prompt">
                        <Upload size={23} />
                        <strong>Choisir un fichier</strong>
                        <span>Formats : {doc.accept || 'image ou PDF'} · 10 Mo maximum</span>
                    </label>
                )}
                <input
                    id={id}
                    type="file"
                    accept={doc.accept || 'image/*,.pdf'}
                    disabled={uploading}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={onChange}
                    className="enrollment-file-input"
                />
            </div>
            {error && (
                <p id={`${id}-error`} className="enrollment-field-error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
