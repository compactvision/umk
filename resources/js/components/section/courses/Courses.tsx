import { useEffect, useRef } from 'react';
import Isotope from 'isotope-layout';

export default function Courses() {
  const isotope = useRef();
  const filterKey = useRef('*');
  const gridRef = useRef(null);

  // Initialiser Isotope
  useEffect(() => {
    if (gridRef.current) {
      isotope.current = new Isotope(gridRef.current, {
        itemSelector: '.grid-item',
        layoutMode: 'masonry',
        masonry: {
          columnWidth: '.grid-item'
        }
      });

      return () => isotope.current.destroy();
    }
  }, []);

  // Gérer le filtrage
  const handleFilter = (filter) => {
    filterKey.current = filter;
    isotope.current.arrange({ filter: filterKey.current });
  };

  // Données des cours
  const courses = [
    {
      id: 1,
      categories: ['cat1', 'cat4'],
      image: 'assets/img/program/pro-img01.png',
      alt: 'Biomédical',
      department: 'Médical',
      rating: 5.0,
      title: 'MBA en Ingénierie Biomédicale',
      seats: 200,
      semesters: 14
    },
    {
      id: 2,
      categories: ['cat3', 'cat5', 'cat4'],
      image: 'assets/img/program/pro-img02.png',
      alt: 'Management',
      department: 'Management',
      rating: 4.5,
      title: 'MBA en Bâtiment Avancé',
      seats: 250,
      semesters: 14
    },
    {
      id: 3,
      categories: ['cat2', 'cat5'],
      image: 'assets/img/program/pro-img03.png',
      alt: 'Bâtiment',
      department: 'Bâtiment',
      rating: 4.0,
      title: 'MBA en Bâtiment Avancé',
      seats: 250,
      semesters: 14
    },
    {
      id: 4,
      categories: ['cat2', 'cat5'],
      image: 'assets/img/program/pro-img03.png',
      alt: 'Bâtiment',
      department: 'Bâtiment',
      rating: 4.0,
      title: 'MBA en Bâtiment Avancé',
      seats: 250,
      semesters: 14
    },
    {
      id: 5,
      categories: ['cat2', 'cat5'],
      image: 'assets/img/program/pro-img03.png',
      alt: 'Bâtiment',
      department: 'Bâtiment',
      rating: 4.0,
      title: 'MBA en Bâtiment Avancé',
      seats: 250,
      semesters: 14
    },
    {
      id: 6,
      categories: ['cat2', 'cat5'],
      image: 'assets/img/program/pro-img03.png',
      alt: 'Bâtiment',
      department: 'Bâtiment',
      rating: 4.0,
      title: 'MBA en Bâtiment Avancé',
      seats: 250,
      semesters: 14
    }
  ];

  return (
    <section className="courses pt-120 pb-120">
      <div className="container">
        <div className="text-center">
          <div className="program-menu mb-70 text-center">
            <button 
              className="active" 
              onClick={() => handleFilter('*')}
            >
              TOUS
            </button>
            <button onClick={() => handleFilter('.cat1')}>
              Développement
            </button>
            <button onClick={() => handleFilter('.cat2')}>
              Bâtiment
            </button>
            <button onClick={() => handleFilter('.cat3')}>
              Sciences
            </button>
            <button onClick={() => handleFilter('.cat4')}>
              Art & Design
            </button>
            <button onClick={() => handleFilter('.cat5')}>
              Marketing
            </button>
          </div>
        </div>
        
        <div className="row mt-none-30" ref={gridRef}>
          {courses.map((course) => (
            <div 
              key={course.id}
              className={`col-lg-4 col-md-6 col-sm-6 grid-item ${course.categories.map(cat => cat).join(' ')}`}
            >
              <div className="xb-program__wrapper mt-30">
                <div className="xb-item--img text-center">
                  <a href="#">
                    <img src={course.image} alt={course.alt} />
                  </a>
                </div>
                <div className="xb-item--holder">
                  <div className="xb-item--deprt ul_li_between">
                    <span className="xb-item--group"># {course.department}</span>
                    <div className="xb-item--rating">
                      <span>{course.rating}</span> 
                      <img src="assets/img/icon/rating.png" alt={`Note ${course.rating} étoiles`} />
                    </div>
                  </div>
                  <h2 className="xb-item--title border-effect-2">
                    <a href="#">{course.title}</a>
                  </h2>
                  <ul className="xb-item--meta ul_li">
                    <li>
                      <img src="assets/img/icon/meta-icon01.png" alt="Places disponibles" />
                      {course.seats} places
                    </li>
                    <li>
                      <img src="assets/img/icon/clock.png" alt="Durée" />
                      {course.semesters} semestres
                    </li>
                  </ul>
                  <div className="xb-item--dep-btn">
                    <a href="#">S'inscrire</a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}