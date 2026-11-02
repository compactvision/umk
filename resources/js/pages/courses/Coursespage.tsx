import App from '@/components/layouts/Home/App';
import PublicImage from '@/components/seo/PublicImage';
import Breadcrumb from '@/components/UI/home/Breadcumb';
import { fields } from '@/lib/usk';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
type Faculty = { id: number; name: string; levels?: { id: number; title?: string; name?: string }[] };
export default function Coursespage() {
    const { faculties } = usePage().props;
    const rows = (faculties as { data?: Faculty[] })?.data ?? [];
    const [search, setSearch] = useState('');
    const catalogue = rows.length ? rows : fields.map((f, i) => ({ id: i, name: f.name, levels: [] }));
    const filtered = catalogue.filter((f) =>
        `${f.name} ${(f.levels ?? []).map((l) => l.title || l.name || '').join(' ')}`
            .toLocaleLowerCase('fr')
            .includes(search.toLocaleLowerCase('fr')),
    );
    return (
        <App>
            <Breadcrumb
                title="Le savoir, à votre mesure."
                desc="Découvrez nos facultés et construisez le parcours qui donnera vie à votre vocation."
            />
            <section className="usk-section">
                <div className="usk-container">
                    <div className="usk-section-heading">
                        <div>
                            <span className="usk-eyebrow">Facultés et formations</span>
                            <h2>
                                À chacun <em>sa voie.</em>
                            </h2>
                        </div>
                        <label>
                            <span className="usk-eyebrow" style={{ marginBottom: 8 }}>
                                Rechercher une formation
                            </span>
                            <input
                                className="usk-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Médecine, droit, santé…"
                                type="search"
                            />
                        </label>
                    </div>
                    <div className="usk-catalogue">
                        {filtered.map((f, i) => (
                            <article key={f.id} className="usk-catalogue-item">
                                <PublicImage
                                    src={`/assets/usk/${fields.find((field) => f.name.toLowerCase().includes(field.name.toLowerCase()))?.image || fields[i % fields.length].image}`}
                                    alt=""
                                    loading="lazy"
                                />
                                <div>
                                    <span className="usk-eyebrow">Université Simon Kimbangu · Faculté</span>
                                    <h2>{rows.length ? <Link href={`/faculties/${f.id}`}>{f.name}</Link> : f.name}</h2>
                                    {rows.length > 0 && (
                                        <Link href={`/faculties/${f.id}`} className="usk-link" style={{ marginBlock: 16 }}>
                                            Découvrir la faculté <ArrowUpRight size={16} />
                                        </Link>
                                    )}
                                    {f.levels?.length ? (
                                        <div className="usk-course-links">
                                            {f.levels.map((level) => (
                                                <Link href={`/course/${level.id}`} key={level.id}>
                                                    {level.title || level.name || 'Découvrir le programme'}
                                                    <ArrowUpRight size={16} />
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <p>
                                                Renseignez-vous auprès des admissions sur les programmes, les conditions d’accès et les niveaux
                                                proposés.
                                            </p>
                                            <Link href="/contact" className="usk-link" style={{ marginTop: 20 }}>
                                                Demander des informations <ArrowUpRight size={16} />
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </article>
                        ))}
                        {!filtered.length && (
                            <p className="usk-empty">Aucune formation ne correspond à votre recherche. Essayez un autre mot-clé ou contactez-nous.</p>
                        )}
                    </div>
                </div>
            </section>
        </App>
    );
}
