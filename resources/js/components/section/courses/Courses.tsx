import Isotope from 'isotope-layout';
import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function Courses({ faculties }) {
    const isotope = useRef();
    const gridRef = useRef(null);

    const [activeFilter, setActiveFilter] = useState('*');

    // Initialiser Isotope
    useEffect(() => {
        if (gridRef.current) {
            isotope.current = new Isotope(gridRef.current, {
                itemSelector: '.grid-item',
                layoutMode: 'masonry',
                masonry: {
                    columnWidth: '.grid-item',
                },
            });

            return () => isotope.current?.destroy();
        }
    }, []);

    // Gérer le filtrage
    const handleFilter = (filter) => {
        setActiveFilter(filter);
        isotope.current?.arrange({ filter });
    };

    console.log(faculties)

    return (
        <section className="courses pt-120 pb-120">
            <div className="container">
                <div className="text-center">
                    <div className="program-menu mb-70 text-center">
                        <button
                            className={activeFilter === '*' ? 'active' : ''}
                            onClick={() => handleFilter('*')}
                        >
                            TOUS
                        </button>

                        {Array.isArray(faculties) &&
                            faculties.map((faculty) => (
                                <button
                                    key={faculty.id}
                                    className={activeFilter === `.${faculty.code}` ? 'active' : ''}
                                    onClick={() => handleFilter(`.${faculty.code}`)}
                                >
                                    {faculty.name}
                                </button>
                            ))}
                    </div>
                </div>

                <div className="row mt-none-30" ref={gridRef}>
                    {Array.isArray(faculties) &&
                        faculties.map((faculty) => {
                            const levels = Array.isArray(faculty.levels) ? faculty.levels : [];
                            return levels.map((level) => (
                                <div
                                    key={level.id}
                                    className={`col-lg-4 col-md-6 col-sm-6 grid-item ${faculty.code}`}
                                >
                                    <div className="xb-program__wrapper mt-30">
                                        <div className="xb-item--img text-center">
                                            <Link href={route('courseShow', level.id)}>
                                                <img src={`/storage/${level.image}`} alt={level.level_code} />
                                            </Link>
                                        </div>
                                        <div className="xb-item--holder">
                                            <div className="xb-item--deprt ul_li_between">
                                                <span className="xb-item--group"># {faculty.name}</span>
                                                <div className="xb-item--rating">
                                                    <span>.</span>
                                                    <img src="/assets/img/icon/rating.png" alt="Note" />
                                                </div>
                                            </div>
                                            <h2 className="xb-item--title border-effect-2">
                                                <Link href="#">{level.level_name}</Link>
                                            </h2>
                                            <ul className="xb-item--meta ul_li">
                                                <li>
                                                    <img src="assets/img/icon/meta-icon01.png" alt="Places disponibles" />
                                                    {level.details.student_number ?? 0} places
                                                </li>
                                                <li>
                                                    <img src="assets/img/icon/clock.png" alt="Durée" />
                                                    {level.details.duration_years} an(s)
                                                </li>
                                            </ul>
                                            <div className="xb-item--dep-btn">
                                                <Link href={route('courseShow', level.id)}>Voir</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ));
                        })}
                    {faculties.length === 0 && (
                        <div>Pas de cours disponible</div>
                    )}
                </div>
            </div>
        </section>
    );
}
