import React, { useState, useEffect, useMemo } from 'react';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import { usePage } from '@inertiajs/react';
import LevelPopup from '@/components/form/LevelPopup';

export default function FacultyShow() {
    const { faculties } = usePage().props;
    const allFaculties = useMemo(() => faculties?.data || [], [faculties]);

    const [selectedFaculties, setSelectedFaculties] = useState(['all']);
    const [filteredFaculties, setFilteredFaculties] = useState(allFaculties);
    const [isOpen, setIsOpen] = useState(false);
    const openPopup = () => setIsOpen(true)
    const closePopup = () => setIsOpen(false)


    useEffect(() => {
        if (selectedFaculties.includes('all')) {
            setFilteredFaculties(allFaculties);
        } else {
            const filtered = allFaculties.filter(fac => selectedFaculties.includes(String(fac.id)));
            setFilteredFaculties(filtered);
        }
    }, [selectedFaculties, allFaculties]);

    const toggleFaculty = (id: string) => {
        if (id === 'all') {
            setSelectedFaculties(['all']);
        } else {
            let updated = [...selectedFaculties];
            if (updated.includes('all')) {
                updated = [];
            }

            if (updated.includes(id)) {
                updated = updated.filter(f => f !== id);
            } else {
                updated.push(id);
            }

            setSelectedFaculties(updated.length === 0 ? ['all'] : updated);
        }
    };

    return (
        <Dashboard>
            <div className="content">
                <main className="courses">
                    {filteredFaculties.length === 0 ? (
                        <div><h2 className="courses__title">Pas de faculté disponible</h2></div>
                    ) : (
                        filteredFaculties.map((faculty) => (
                            <section key={faculty.id} className="courses__section">
                                <h2 className="courses__title">{faculty.name}</h2>
                                <div className="courses__grid">
                                    {Array.isArray(faculty.levels) && faculty.levels.length === 0 ? (
                                        <p className="course-card__name">Pas de niveau pour cette faculté</p>
                                    ) : (
                                        (faculty.levels || []).map((level) => (
                                            <div key={level.id} className="course-card">
                                                <img src={`/storage/${level.image}`} alt={level.level_code} className="course-card__image" />
                                                <h3 className="course-card__name">{level.level_name}</h3>
                                                <div className="course-card__overlay">{level.courses_number} cours</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        ))
                    )}
                </main>

                <aside className="filters">
                    <div>
                        <button className="create-btn" onClick={openPopup}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <g fill="none" stroke="currentColor" strokeDasharray="16" strokeDashoffset="16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                    <path d="M5 12h14">
                                        <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="16;0"/>
                                    </path>
                                    <path d="M12 5v14">
                                        <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.4s" values="16;0"/>
                                    </path>
                                </g>
                            </svg>
                            <p>Ajouter niveau</p>
                        </button>
                    </div><br/>

                    <h3 className="filters__title">Facultés</h3>
                    <ul className="filters__list">
                        <li>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedFaculties.includes('all')}
                                    onChange={() => toggleFaculty('all')}
                                />
                                Tout
                            </label>
                        </li>
                        {allFaculties.map((faculty) => (
                            <li key={faculty.id}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedFaculties.includes(String(faculty.id))}
                                        onChange={() => toggleFaculty(String(faculty.id))}
                                    />
                                    {faculty.name}
                                </label>
                            </li>
                        ))}
                    </ul>
                </aside>

                {isOpen && (
                    <LevelPopup isOpen={isOpen} onClose={closePopup} faculties={faculties}/>
                )}
            </div>
        </Dashboard>
    );
}
