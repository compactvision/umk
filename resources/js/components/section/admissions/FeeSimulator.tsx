import {
    admissionFaculties,
    admissionsSource,
    admissionsVerified,
    admissionsYear,
    calculateAcademicFees,
    formatUSD,
    type AdmissionRegime,
    type CandidateCategory,
} from '@/lib/admissions';
import { ArrowRight, ArrowUpRight, Calculator, Check, Download, Printer } from 'lucide-react';
import { useState } from 'react';
type Props = {
    facultyId: string;
    setFacultyId: (id: string) => void;
    category: CandidateCategory;
    setCategory: (category: CandidateCategory) => void;
};
export default function FeeSimulator({ facultyId, setFacultyId, category, setCategory }: Props) {
    const [regime, setRegime] = useState<AdmissionRegime>('standard');
    const [downloaded, setDownloaded] = useState(false);
    const faculty = admissionFaculties.find((f) => f.id === facultyId)!;
    const estimate = calculateAcademicFees(facultyId, category, regime);
    const categoryName = category === 'national' ? 'Candidat national' : 'Candidat étranger';
    const regimeName = regime === 'standard' ? 'Inscription ordinaire' : 'Inscription spéciale — applicabilité à confirmer';
    const totalLabel = regime === 'standard' ? 'Total académique' : 'Total du barème spécial';
    const estimateNote =
        regime === 'standard'
            ? 'Frais académiques uniquement. Dossier, tests, frais annexes et dépenses personnelles à prévoir séparément. Échéances à confirmer auprès du service.'
            : 'Le flyer affecte la première tranche au dossier, au test et au formulaire, et la seconde aux frais connexes. Applicabilité, autres frais et échéances à confirmer auprès du service.';
    const download = () => {
        const text = `UNIVERSITÉ SIMON KIMBANGU\nEstimation des frais ${admissionsYear}\n\n${faculty.name}\n${categoryName}\n${regimeName}\n\nPremière tranche : ${formatUSD(estimate.first)}\nDeuxième tranche : ${formatUSD(estimate.second)}\n${totalLabel} : ${formatUSD(estimate.total)}\n\n${estimateNote}\nCette estimation ne confirme ni l’admission ni une échéance de paiement.\nBarème vérifié le ${admissionsVerified}. Montants à confirmer auprès des admissions.\nSource : ${admissionsSource}\nContact : +243 894 465 813 · contact@universitesk.net\n`;
        const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `USK-estimation-${facultyId}-${category}-${regime}.txt`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setDownloaded(true);
    };
    return (
        <section className="adm-section adm-simulator" id="simulateur" data-admission-section>
            <div className="usk-container">
                <div className="adm-section-top">
                    <span className="usk-eyebrow">Votre budget, en toute clarté</span>
                    <span>04 / SIMULATEUR</span>
                </div>
                <div className="adm-simulator-layout">
                    <div className="adm-simulator-inputs">
                        <span className="adm-line-icon">
                            <Calculator size={29} strokeWidth={1.3} />
                        </span>
                        <h2>
                            Faites le calcul.
                            <br />
                            <em>Voyez plus loin.</em>
                        </h2>
                        <p>Choisissez votre situation et découvrez immédiatement la répartition de vos frais académiques.</p>
                        <label htmlFor="estimate-faculty">
                            Votre faculté
                            <select id="estimate-faculty" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                                {admissionFaculties.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <fieldset>
                            <legend>Votre catégorie</legend>
                            <div className="adm-segmented">
                                <button type="button" aria-pressed={category === 'national'} onClick={() => setCategory('national')}>
                                    National
                                </button>
                                <button type="button" aria-pressed={category === 'international'} onClick={() => setCategory('international')}>
                                    Étranger
                                </button>
                            </div>
                        </fieldset>
                        <label htmlFor="estimate-regime">
                            Régime d’inscription
                            <select id="estimate-regime" value={regime} onChange={(e) => setRegime(e.target.value as AdmissionRegime)}>
                                <option value="standard">Ordinaire — par faculté</option>
                                <option value="special">Spéciale — à confirmer avec le service</option>
                            </select>
                        </label>
                        {regime === 'special' && (
                            <p className="adm-simulator-caution">
                                Le barème spécial publié est distinct. Les admissions doivent confirmer qu’il s’applique à votre dossier ; il ne se
                                cumule pas avec le barème ordinaire.
                            </p>
                        )}
                    </div>
                    <div className="adm-estimate" id="admission-estimate">
                        <div className="adm-estimate-brand">
                            <img src="/assets/usk/logo.png" alt="USK" />
                            <div>
                                <span>UNIVERSITÉ SIMON KIMBANGU</span>
                                <strong>Votre estimation de frais</strong>
                            </div>
                            <span>{admissionsYear}</span>
                        </div>
                        <div aria-live="polite" aria-atomic="true">
                            <div className="adm-estimate-meta">
                                <span>{faculty.shortName}</span>
                                <span>{categoryName}</span>
                            </div>
                            <span className="adm-estimate-label">
                                {regime === 'standard' ? 'TOTAL DES FRAIS ACADÉMIQUES' : 'TOTAL DU BARÈME SPÉCIAL'}
                            </span>
                            <p className="adm-estimate-total">
                                {new Intl.NumberFormat('fr-CD').format(estimate.total)}
                                <span>USD</span>
                            </p>
                            <p className="adm-estimate-regime">{regimeName}</p>
                            <div className="adm-estimate-split">
                                <div>
                                    <span>01</span>
                                    <p>Première tranche</p>
                                    <strong>{formatUSD(estimate.first)}</strong>
                                </div>
                                <ArrowRight size={20} />
                                <div>
                                    <span>02</span>
                                    <p>Deuxième tranche</p>
                                    <strong>{formatUSD(estimate.second)}</strong>
                                </div>
                            </div>
                            <div className="adm-estimate-bar" aria-hidden="true">
                                <span style={{ width: `${(estimate.first / estimate.total) * 100}%` }} />
                                <span />
                            </div>
                            <p className="adm-estimate-note">{estimateNote}</p>
                        </div>
                        <div className="adm-estimate-actions">
                            <button type="button" onClick={download}>
                                {downloaded ? <Check size={15} /> : <Download size={15} />}Télécharger (.txt)
                            </button>
                            <button type="button" onClick={() => window.print()} aria-label="Imprimer / PDF : imprimer ou enregistrer le résultat">
                                <Printer size={15} />
                                Imprimer / PDF
                            </button>
                        </div>
                        <div className="adm-estimate-footer">
                            <span>Barème vérifié le {admissionsVerified}</span>
                            <a href="#frais">
                                Voir le détail <ArrowUpRight size={13} />
                            </a>
                        </div>
                        <p className="adm-print-source">Source : {admissionsSource} · +243 894 465 813</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
