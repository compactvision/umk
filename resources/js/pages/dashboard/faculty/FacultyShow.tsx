import Dashboard from '@/components/layouts/Dashboard/Dashboard';

export default function FacultyShow() {
    return(
        <Dashboard>
            <div className="content">
                <main className="courses">
                    <section className="courses__section">
                        <h2 className="courses__title">Popular Courses</h2>
                        <div className="courses__grid">
                            <div className="course-card">
                                <img src="mailchimp.png" alt="Newsletter Design" className="course-card__image" />
                                <h3 className="course-card__name">Newsletter Design</h3>
                                <div className="course-card__overlay">12 lessons</div>
                            </div>
                            <div className="course-card">
                                <img src="xd.png" alt="Adobe XD" className="course-card__image" />
                                <h3 className="course-card__name">Adobe XD</h3>
                                <div className="course-card__overlay">8 lessons</div>
                            </div>
                            <div className="course-card">
                                <img src="mailchimp.png" alt="Newsletter Design" className="course-card__image" />
                                <h3 className="course-card__name">Newsletter Design</h3>
                                <div className="course-card__overlay">12 lessons</div>
                            </div>
                            <div className="course-card">
                                <img src="xd.png" alt="Adobe XD" className="course-card__image" />
                                <h3 className="course-card__name">Adobe XD</h3>
                                <div className="course-card__overlay">8 lessons</div>
                            </div>
                            <div className="course-card">
                                <img src="mailchimp.png" alt="Newsletter Design" className="course-card__image" />
                                <h3 className="course-card__name">Newsletter Design</h3>
                                <div className="course-card__overlay">12 lessons</div>
                            </div>
                            <div className="course-card">
                                <img src="xd.png" alt="Adobe XD" className="course-card__image" />
                                <h3 className="course-card__name">Adobe XD</h3>
                                <div className="course-card__overlay">8 lessons</div>
                            </div>
                        </div>
                    </section>

                </main>

                <aside className="filters">
                    <h3 className="filters__title">Category</h3>
                    <ul className="filters__list">
                        <li><label><input type="checkbox" checked /> Web Development</label></li>
                        <li><label><input type="checkbox" /> Design</label></li>
                        <li><label><input type="checkbox" /> iOS & Swift</label></li>
                    </ul>

                    <h3 className="filters__title">Platform</h3>
                    <ul className="filters__list">
                        <li><label><input type="checkbox" checked /> All</label></li>
                        <li><label><input type="checkbox" /> Web</label></li>
                        <li><label><input type="checkbox" /> iOS & Swift</label></li>
                    </ul>
                </aside>
            </div>


        </Dashboard>
    )
}
