export default function Presentation() {
    return (
        <>
            <header className="main__header">
                <h1 className="main__title">Bienvenue dans votre Dashboard</h1>
                <p className="main__subtitle">Gérez vos projets, analysez vos données et collaborez avec votre équipe en toute simplicité.</p>
            </header>

            <section className="main__section animate-fade-in">
                <h2
                    style={{
                        marginBottom: '1rem',
                        fontSize: '1.25rem',
                        fontWeight: '600',
                    }}
                >
                    Interface Moderne et Responsive
                </h2>
                <p
                    style={{
                        marginBottom: '1.5rem',
                        color: '#f59e0b',
                    }}
                >
                    Cette interface utilise les dernières tendances en matière de design web avec une approche mobile-first. Cliquez sur les icônes de
                    la barre latérale pour explorer les différentes sections.
                </p>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem',
                        marginTop: '2rem',
                    }}
                >
                    <div
                        style={{
                            padding: '1.5rem',
                            background: '#f59e0b',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <h3
                            style={{
                                marginBottom: '0.75rem',
                                fontWeight: '600',
                                color: '#f59e0b',
                            }}
                        >
                            🎨 Design System
                        </h3>
                        <p
                            style={{
                                color: '#f59e0b',
                                fontSize: '0.875rem',
                            }}
                        >
                            Architecture BEM, variables CSS, et
                        </p>
                    </div>

                    <div
                        style={{
                            padding: '1.5rem',
                            background: '#f59e0b',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <h3
                            style={{
                                marginBottom: '0.75rem',
                                fontWeight: '600',
                                color: '#f59e0b',
                            }}
                        >
                            📱 Responsive
                        </h3>
                        <p
                            style={{
                                color: '#f59e0b',
                                fontSize: '0.875rem',
                            }}
                        >
                            Interface adaptative qui s'ajuste automatiquement à tous les types d'écrans et appareils.
                        </p>
                    </div>

                    <div
                        style={{
                            padding: '1.5rem',
                            background: '#f59e0b',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <h3
                            style={{
                                marginBottom: '0.75rem',
                                fontWeight: '600',
                                color: '#f59e0b',
                            }}
                        >
                            ♿ Accessibilité
                        </h3>
                        <p
                            style={{
                                color: '#f59e0b',
                                fontSize: '0.875rem',
                            }}
                        >
                            Respect des standards WCAG avec navigation au clavier et lecteurs d'écran supportés.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
