import { formatPrice, paymentCategories, paymentTotal } from '@/lib/levelPricing';
import { Banknote, BookOpen, Clock3, Coins, Layers3, Pencil, Users } from 'lucide-react';
import type { useLevelData } from '../hooks/useLevelData';
export default function StatsGrid({
    levelData,
    onEdit,
}: {
    levelData: ReturnType<typeof useLevelData>['detailsData'];
    onEdit: (field: string) => void;
}) {
    const number = (value: unknown) => Number(value || 0).toLocaleString('fr-FR');
    const stats: { field: keyof typeof levelData; label: string; value: string; icon: typeof Clock3 }[] = [
        {
            field: 'duration_years',
            label: 'Durée du parcours',
            value: levelData.duration_years > 0 ? `${number(levelData.duration_years)} an${levelData.duration_years > 1 ? 's' : ''}` : 'À préciser',
            icon: Clock3,
        },
        {
            field: 'credit_required',
            label: 'Crédits requis',
            value: levelData.credit_required === '' ? 'À préciser' : number(levelData.credit_required),
            icon: Layers3,
        },
        { field: 'courses_number', label: 'Cours au programme', value: number(levelData.courses_number), icon: BookOpen },
        { field: 'student_number', label: 'Effectif étudiant', value: number(levelData.student_number), icon: Users },
        {
            field: 'price',
            label: 'Tarif nationaux',
            value: formatPrice(paymentTotal(levelData.price_national_first, levelData.price_national_second, levelData.price)),
            icon: Banknote,
        },
        {
            field: 'price_foreign',
            label: 'Tarif étrangers',
            value: formatPrice(paymentTotal(levelData.price_foreign_first, levelData.price_foreign_second, levelData.price_foreign)),
            icon: Banknote,
        },
        { field: 'fees', label: 'Frais complémentaires', value: Number(levelData.fees) > 0 ? `${number(levelData.fees)} $` : 'Aucun frais', icon: Coins },
    ];
    return (
        <section className="ld-metrics-section" aria-labelledby="ld-metrics-title">
            <div className="ld-section-heading">
                <div>
                    <span className="ld-eyebrow">LES REPÈRES ESSENTIELS</span>
                    <h2 id="ld-metrics-title">Le parcours en un regard.</h2>
                </div>
                <p>Les informations clés de votre formation.</p>
            </div>
            <div className="ld-metrics">
                {stats.map((stat) => (
                    <div className="ld-metric" key={stat.field}>
                        <div className="ld-metric-top">
                            <span className="ld-icon">
                                <stat.icon size={20} strokeWidth={1.6} />
                            </span>
                            <button
                                className="ld-icon-button"
                                aria-label={`Modifier : ${stat.label}`}
                                onClick={() => onEdit(stat.field)}
                            >
                                <Pencil size={15} strokeWidth={1.7} />
                            </button>
                        </div>
                        <span className="ld-metric-label">{stat.label}</span>
                        {paymentCategories
                            .filter((category) => category.total === stat.field)
                            .map((category) => (
                                <dl className="ld-payment-parts" key={category.total}>
                                    <div>
                                        <dt>1re tranche</dt>
                                        <dd>{formatPrice(levelData[category.first])}</dd>
                                    </div>
                                    <div>
                                        <dt>2e tranche</dt>
                                        <dd>{formatPrice(levelData[category.second])}</dd>
                                    </div>
                                    <div className="ld-payment-total-label">
                                        <dt>Total</dt>
                                    </div>
                                </dl>
                            ))}
                        <strong>{stat.value}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}
