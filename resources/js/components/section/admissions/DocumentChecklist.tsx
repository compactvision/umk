import { admissionDocuments } from '@/lib/admissions';
import { Check, FileCheck2, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
const storageKey = 'usk-admission-checklist-2026-2027';
export default function DocumentChecklist() {
    const [checked, setChecked] = useState<string[]>([]);
    const [ready, setReady] = useState(false);
    useEffect(() => {
        try {
            const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (Array.isArray(saved))
                setChecked([
                    ...new Set(saved.filter((id): id is string => typeof id === 'string' && admissionDocuments.some((doc) => doc.id === id))),
                ]);
        } catch {
            /* Preparation remains usable without browser storage. */
        }
        setReady(true);
    }, []);
    useEffect(() => {
        if (ready)
            try {
                localStorage.setItem(storageKey, JSON.stringify(checked));
            } catch {
                /* Storage can be disabled. */
            }
    }, [checked, ready]);
    const percent = Math.round((checked.length / admissionDocuments.length) * 100);
    return (
        <section id="conditions" className="adm-section adm-conditions" data-admission-section>
            <div className="usk-container">
                <div className="adm-section-top">
                    <span className="usk-eyebrow">Préparer, simplement</span>
                    <span>01 / CONDITIONS</span>
                </div>
                <div className="adm-checklist-layout">
                    <div className="adm-condition-intro">
                        <span className="adm-line-icon">
                            <FileCheck2 size={29} strokeWidth={1.3} />
                        </span>
                        <h2>
                            Un dossier prêt.
                            <br />
                            <em>Un départ serein.</em>
                        </h2>
                        <p>
                            Pour candidater, vous devez détenir un diplôme d’État ou un titre reconnu équivalent. Les tests et les modalités d’entrée
                            se précisent avec la faculté.
                        </p>
                        <div className="adm-preparation-card">
                            <div>
                                <span>VOTRE PRÉPARATION</span>
                                <strong>
                                    {checked.length}
                                    <small> / {admissionDocuments.length}</small>
                                </strong>
                            </div>
                            <div
                                role="progressbar"
                                aria-label="Progression de votre checklist"
                                aria-valuemin={0}
                                aria-valuemax={admissionDocuments.length}
                                aria-valuenow={checked.length}
                                className="adm-preparation-track"
                            >
                                <span style={{ width: `${percent}%` }} />
                            </div>
                            <p aria-live="polite">
                                {percent === 100
                                    ? 'Votre liste est complétée. Le service des admissions vérifiera le dossier.'
                                    : 'Cochez les pièces préparées ou les points qui ne concernent pas votre situation.'}
                            </p>
                            <button type="button" onClick={() => setChecked([])} disabled={!checked.length}>
                                <RotateCcw size={12} />
                                Réinitialiser ma liste
                            </button>
                        </div>
                        <p className="adm-small-note">
                            Votre progression est conservée dans ce navigateur. Aucun document personnel n’est téléversé ici.
                        </p>
                    </div>
                    <div className="adm-checklist">
                        {admissionDocuments.map((doc, i) => (
                            <label key={doc.id} className={checked.includes(doc.id) ? 'adm-document is-complete' : 'adm-document'}>
                                <input
                                    type="checkbox"
                                    checked={checked.includes(doc.id)}
                                    onChange={(e) =>
                                        setChecked((previous) => (e.target.checked ? [...previous, doc.id] : previous.filter((id) => id !== doc.id)))
                                    }
                                />
                                <span className="adm-checkbox" aria-hidden="true">
                                    {checked.includes(doc.id) ? <Check size={15} /> : String(i + 1).padStart(2, '0')}
                                </span>
                                <span>
                                    <strong>{doc.title}</strong>
                                    <small>{doc.detail}</small>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
