import App from '@/components/layouts/Home/App';
import Breadcumb from '@/components/UI/home/Breadcumb';
import { Link, usePage } from '@inertiajs/react';
import { Check, Play, Star } from 'lucide-react';

export default function CoursShow() {
    const { course, mayLike } = usePage().props;

    console.log(mayLike);
    return (
        <App>
            <Breadcumb title={course.faculty.name} desc={course.level_name} />

            <section className="course-single pt-120 pb-120">
                <div className="container">
                    <div className="course-single-image">
                        <img src={`/storage/${course.details.illustration_image}`} alt="" />
                    </div>
                    <div className="row mt-none-30 flex-row-reverse">
                        <div className="col-lg-4 mt-30">
                            <div className="course-sidebar">
                                <div className="course-sidebar__video pos-rel">
                                    <img src={`/storage/${course.image}`} alt="" />
                                    <a className="btn-video btn-video-center popup-video" href="https://www.youtube.com/watch?v=cRXm1p-CNyk">
                                        <Play size={16} />
                                    </a>
                                </div>
                                <h3 className="course-sidebar__title">Le niveau comprends:</h3>
                                <ul className="course-sidebar__list list-border-none list-unstyled">
                                    <li>
                                        <div>
                                            <span>
                                                <img src="/assets/img/icon/ci_01.svg" alt="" />
                                            </span>
                                            Prix:<span className="price">{course.details.price} $</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="/assets/img/icon/ci_03.svg" alt="" />
                                            Durée:
                                        </span>
                                        <span>{course.details.duration_years * 2} Semestres</span>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="/assets/img/icon/ci_04.svg" alt="" />
                                            Cours:
                                        </span>
                                        <span>{course.details.courses_number}</span>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="/assets/img/icon/ci_05.svg" alt="" />
                                            Etudiants:
                                        </span>
                                        <span>{course.details.student_number}</span>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="/assets/img/icon/ci_06.svg" alt="" />
                                            Langue:
                                        </span>
                                        <span>{course.details.language}</span>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="/assets/img/icon/ci_07.svg" alt="" />
                                            Certifications:
                                        </span>
                                        <span>{course.details.has_certificate ? 'Oui' : 'Non'}</span>
                                    </li>
                                </ul>
                                <div className="sidebar-btn mt-35">
                                    <a className="thm-btn" href="#!">
                                        S'inscrire maintenant
                                        <span>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M22 4.85005V16.7401C22 17.7101 21.21 18.6001 20.24 18.7201L19.93 18.7601C18.29 18.9801 15.98 19.6601 14.12 20.4401C13.47 20.7101 12.75 20.2201 12.75 19.5101V5.60005C12.75 5.23005 12.96 4.89005 13.29 4.71005C15.12 3.72005 17.89 2.84005 19.77 2.68005H19.83C21.03 2.68005 22 3.65005 22 4.85005Z"
                                                    fill="#170006"
                                                ></path>
                                                <path
                                                    d="M10.7102 4.71005C8.88023 3.72005 6.11023 2.84005 4.23023 2.68005H4.16023C2.96023 2.68005 1.99023 3.65005 1.99023 4.85005V16.7401C1.99023 17.7101 2.78023 18.6001 3.75023 18.7201L4.06023 18.7601C5.70023 18.9801 8.01023 19.6601 9.87023 20.4401C10.5202 20.7101 11.2402 20.2201 11.2402 19.5101V5.60005C11.2402 5.22005 11.0402 4.89005 10.7102 4.71005ZM5.00023 7.74005H7.25023C7.66023 7.74005 8.00023 8.08005 8.00023 8.49005C8.00023 8.91005 7.66023 9.24005 7.25023 9.24005H5.00023C4.59023 9.24005 4.25023 8.91005 4.25023 8.49005C4.25023 8.08005 4.59023 7.74005 5.00023 7.74005ZM8.00023 12.2401H5.00023C4.59023 12.2401 4.25023 11.9101 4.25023 11.4901C4.25023 11.0801 4.59023 10.7401 5.00023 10.7401H8.00023C8.41023 10.7401 8.75023 11.0801 8.75023 11.4901C8.75023 11.9101 8.41023 12.2401 8.00023 12.2401Z"
                                                    fill="#170006"
                                                ></path>
                                            </svg>
                                        </span>
                                    </a>
                                </div>
                                <div className="course-sidebar__social-wrap ul_li mt-25">
                                    <h4>Partager sur : </h4>
                                    <ul className="course-sidebar__social ul_li">
                                        <li>
                                            <a href="#!">
                                                <i className="fab fa-linkedin-in"></i>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#!">
                                                <i className="fab fa-facebook-f"></i>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#!">
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M9.4893 6.77491L15.3176 0H13.9365L8.87577 5.88256L4.8338 0H0.171875L6.28412 8.89547L0.171875 16H1.55307L6.8973 9.78782L11.1659 16H15.8278L9.48896 6.77491H9.4893ZM7.59756 8.97384L6.97826 8.08805L2.05073 1.03974H4.17217L8.14874 6.72795L8.76804 7.61374L13.9371 15.0075H11.8157L7.59756 8.97418V8.97384Z"
                                                        fill="#5C5C54"
                                                    />
                                                </svg>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#!">
                                                <i className="fab fa-linkedin-in"></i>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-8 mt-30">
                            <div className="course-single-content mt-25">
                                <div className="course-meta mt-none-30 ul_li mb-35">
                                    <div className="course-meta-item mt-30">
                                        <div className="course-meta-author ul_li">
                                            <div className="xb-item--holder">
                                                <span className="xb-item--title">Code faculté</span>
                                                <h3 className="xb-item--desig">{course.faculty.code}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="course-meta-item mt-30">
                                        <span className="xb-item--title">Code niveau</span>
                                        <h3 className="xb-item--desig">{course.level_code}</h3>
                                    </div>
                                    <div className="course-meta-item mt-30">
                                        <span className="xb-item--title">Avis</span>
                                        <ul className="xb-star ul_li">
                                            <li>
                                                <Star size={16} />
                                            </li>
                                            <li>
                                                <Star size={16} />
                                            </li>
                                            <li>
                                                <Star size={16} />
                                            </li>
                                            <li>
                                                <Star size={16} />
                                            </li>
                                            <li>
                                                <Star size={16} />
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <h2>
                                    {course.level_name}, {course.faculty.name}
                                </h2>
                                <h3>Description du cours</h3>
                                <p>{course.faculty.description}</p>
                                <p>{course.details.description}</p>
                                <h3 className="mt-60">Ce que vous apprendrez de cette option</h3>
                                <p>{course.details.course_objective}</p>
                                <h3 className="mt-60">Conditions d'admission</h3>
                                <ul className="xb-list list-unstyled mb-55">
                                    {course.admission_conditions.map((cond, index) => (
                                        <li key={index} style={{ display: 'flex' }}>
                                            <span>
                                                <Check size={12} />
                                            </span>
                                            <p className="mb-0">{cond.description}</p>
                                        </li>
                                    ))}
                                </ul>

                                <h3>Opportunités possible:</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Qualification</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {course.details.options.map((op, index) => (
                                            <tr key={index}>
                                                <td>{op}</td>
                                            </tr>
                                        ))}
                                        {course.details.options.length == 0 && <tr>Pas d'opportunités trouvées</tr>}
                                    </tbody>
                                </table>
                                <h3>Liste des cours</h3>
                                <div className="faq-inner course-faq mb-60">
                                    <ul className="accordion_box clearfix">
                                        {course.courses.map((c, index) => (
                                            <li className="accordion active-block block" key={index}>
                                                <div className="acc-btn">
                                                    <span className="arrow">
                                                        <i className="far fa-angle-down"></i>
                                                    </span>
                                                    Intro to Course and Hi study
                                                    <span className="course-lesson">4 Lessons • 15m 10s</span>
                                                </div>
                                            </li>
                                        ))}
                                        {course.courses.length == 0 && (
                                            <li className="accordion active-block block">
                                                <div className="acc-btn">Pas de cours trouvés</div>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                                {/*<h3>Your Instructors</h3>*/}
                                {/*<div className="admin-info ul_li mb-65">*/}
                                {/*    <div className="xb-item--avatar">*/}
                                {/*        <img src="/assets/img/course/avatar2.jpg" alt="" />*/}
                                {/*    </div>*/}
                                {/*    <div className="xb-item--holder">*/}
                                {/*        <h3 className="xb-item--name">david martinez</h3>*/}
                                {/*        <span className="xb-item--desig">Management Instructor</span>*/}
                                {/*        <ul className="xb-item--meta ul_li">*/}
                                {/*            <li>*/}
                                {/*                <i className="fas fa-star"></i>4.7 Rating*/}
                                {/*            </li>*/}
                                {/*            <li>*/}
                                {/*                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
                                {/*                    <path*/}
                                {/*                        d="M5.61133 7.50075V6.53875C5.61133 5.29725 6.48883 4.79675 7.56133 5.41425L8.39333 5.89525L9.22533 6.37625C10.2978 6.99375 10.2978 8.00775 9.22533 8.62525L8.39333 9.10625L7.56133 9.58725C6.48883 10.2048 5.61133 9.69775 5.61133 8.46275V7.50075Z"*/}
                                {/*                        stroke="#5C5C54"*/}
                                {/*                        stroke-width="1.2"*/}
                                {/*                        stroke-miterlimit="10"*/}
                                {/*                        stroke-linecap="round"*/}
                                {/*                        stroke-linejoin="round"*/}
                                {/*                    />*/}
                                {/*                    <path*/}
                                {/*                        d="M7.5 14C11.0899 14 14 11.0899 14 7.5C14 3.91015 11.0899 1 7.5 1C3.91015 1 1 3.91015 1 7.5C1 11.0899 3.91015 14 7.5 14Z"*/}
                                {/*                        stroke="#5C5C54"*/}
                                {/*                        stroke-width="1.2"*/}
                                {/*                        stroke-linecap="round"*/}
                                {/*                        stroke-linejoin="round"*/}
                                {/*                    />*/}
                                {/*                </svg>*/}
                                {/*                58 Courses*/}
                                {/*            </li>*/}
                                {/*            <li>*/}
                                {/*                <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
                                {/*                    <path*/}
                                {/*                        d="M6.57111 7.5C8.36216 7.5 9.81407 6.04493 9.81407 4.25C9.81407 2.45507 8.36216 1 6.57111 1C4.78006 1 3.32812 2.45507 3.32812 4.25C3.32812 6.04493 4.78006 7.5 6.57111 7.5Z"*/}
                                {/*                        stroke="#5C5C54"*/}
                                {/*                        stroke-width="1.2"*/}
                                {/*                        stroke-linecap="round"*/}
                                {/*                        stroke-linejoin="round"*/}
                                {/*                    />*/}
                                {/*                    <path*/}
                                {/*                        d="M12.1429 14C12.1429 11.4845 9.64577 9.44995 6.57143 9.44995C3.49709 9.44995 1 11.4845 1 14"*/}
                                {/*                        stroke="#5C5C54"*/}
                                {/*                        stroke-width="1.2"*/}
                                {/*                        stroke-linecap="round"*/}
                                {/*                        stroke-linejoin="round"*/}
                                {/*                    />*/}
                                {/*                </svg>*/}
                                {/*                45 Student*/}
                                {/*            </li>*/}
                                {/*        </ul>*/}
                                {/*        <p>*/}
                                {/*            With 15 years in business and 10 years of teaching, our instructor excels in strategic planning and*/}
                                {/*            leadership.*/}
                                {/*        </p>*/}
                                {/*        <ul className="xb-social ul_li mt-30">*/}
                                {/*            <li>*/}
                                {/*                <a href="#!">*/}
                                {/*                    <i className="fab fa-facebook-f"></i>*/}
                                {/*                </a>*/}
                                {/*            </li>*/}
                                {/*            <li>*/}
                                {/*                <a href="#!">*/}
                                {/*                    <i className="fab fa-linkedin-in"></i>*/}
                                {/*                </a>*/}
                                {/*            </li>*/}
                                {/*            <li>*/}
                                {/*                <a href="#!">*/}
                                {/*                    <i className="fab fa-pinterest-p"></i>*/}
                                {/*                </a>*/}
                                {/*            </li>*/}
                                {/*            <li>*/}
                                {/*                <a href="#!">*/}
                                {/*                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
                                {/*                        <path*/}
                                {/*                            d="M9.52217 6.77491L15.4785 0H14.0671L8.89516 5.88256L4.76437 0H0L6.24656 8.89547L0 16H1.41155L6.87321 9.78782L11.2356 16H16L9.52183 6.77491H9.52217ZM7.58887 8.97384L6.95596 8.08805L1.92015 1.03974H4.0882L8.15216 6.72795L8.78507 7.61374L14.0677 15.0075H11.8997L7.58887 8.97418V8.97384Z"*/}
                                {/*                            fill="#161A2C"*/}
                                {/*                        />*/}
                                {/*                    </svg>*/}
                                {/*                </a>*/}
                                {/*            </li>*/}
                                {/*        </ul>*/}
                                {/*    </div>*/}
                                {/*</div>*/}
                                {/*<h3>Ratings & Reviews</h3>*/}
                                {/*<div className="course-review-info ul_li">*/}
                                {/*    <div className="xb-item--review">*/}
                                {/*        <h2 className="xb-item--review-number">4.8</h2>*/}
                                {/*        <ul className="xb-star ul_li_center">*/}
                                {/*            <li>*/}
                                {/*                <i className="fas fa-star"></i>*/}
                                {/*            </li>*/}
                                {/*            <li>*/}
                                {/*                <i className="fas fa-star"></i>*/}
                                {/*            </li>*/}
                                {/*            <li>*/}
                                {/*                <i className="fas fa-star"></i>*/}
                                {/*            </li>*/}
                                {/*            <li>*/}
                                {/*                <i className="fas fa-star"></i>*/}
                                {/*            </li>*/}
                                {/*            <li>*/}
                                {/*                <i className="fas fa-star"></i>*/}
                                {/*            </li>*/}
                                {/*        </ul>*/}
                                {/*        <span className="xb-item--rating-text">1 rating</span>*/}
                                {/*    </div>*/}
                                {/*    <div className="xb-item--progress">*/}
                                {/*        <div className="xb-item--progress-item">*/}
                                {/*            <div className="xb-item--rating ul_li">*/}
                                {/*                <span>5</span>*/}
                                {/*                <i className="fas fa-star"></i>*/}
                                {/*            </div>*/}
                                {/*            <div*/}
                                {/*                className="progress"*/}
                                {/*                role="progressbar"*/}
                                {/*                aria-label="Example with label"*/}
                                {/*                aria-valuenow="95"*/}
                                {/*                aria-valuemin="0"*/}
                                {/*                aria-valuemax="100"*/}
                                {/*            >*/}
                                {/*                <div className="progress-bar" style={{ width: '95%' }}>*/}
                                {/*                    <span>25%</span>*/}
                                {/*                </div>*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*        <div className="xb-item--progress-item">*/}
                                {/*            <div className="xb-item--rating ul_li">*/}
                                {/*                <span>4</span>*/}
                                {/*                <i className="fas fa-star"></i>*/}
                                {/*            </div>*/}
                                {/*            <div*/}
                                {/*                className="progress"*/}
                                {/*                role="progressbar"*/}
                                {/*                aria-label="Basic example"*/}
                                {/*                aria-valuenow="26"*/}
                                {/*                aria-valuemin="0"*/}
                                {/*                aria-valuemax="100"*/}
                                {/*            >*/}
                                {/*                <div className="progress-bar" style={{ width: '26%' }}>*/}
                                {/*                    <span>26%</span>*/}
                                {/*                </div>*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*        <div className="xb-item--progress-item">*/}
                                {/*            <div className="xb-item--rating ul_li">*/}
                                {/*                <span>3</span>*/}
                                {/*                <i className="fas fa-star"></i>*/}
                                {/*            </div>*/}
                                {/*            <div*/}
                                {/*                className="progress"*/}
                                {/*                role="progressbar"*/}
                                {/*                aria-label="Basic example"*/}
                                {/*                aria-valuenow="15"*/}
                                {/*                aria-valuemin="0"*/}
                                {/*                aria-valuemax="100"*/}
                                {/*            >*/}
                                {/*                <div className="progress-bar" style={{ width: '15%' }}>*/}
                                {/*                    <span>15%</span>*/}
                                {/*                </div>*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*        <div className="xb-item--progress-item">*/}
                                {/*            <div className="xb-item--rating ul_li">*/}
                                {/*                <span>2</span>*/}
                                {/*                <i className="fas fa-star-half-alt"></i>*/}
                                {/*            </div>*/}
                                {/*            <div*/}
                                {/*                className="progress"*/}
                                {/*                role="progressbar"*/}
                                {/*                aria-label="Basic example"*/}
                                {/*                aria-valuenow="7"*/}
                                {/*                aria-valuemin="0"*/}
                                {/*                aria-valuemax="100"*/}
                                {/*            >*/}
                                {/*                <div className="progress-bar" style={{ width: '7%' }}>*/}
                                {/*                    <span>7%</span>*/}
                                {/*                </div>*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*        <div className="xb-item--progress-item">*/}
                                {/*            <div className="xb-item--rating ul_li">*/}
                                {/*                <span>1</span>*/}
                                {/*                <i className="fas fa-star-half-alt"></i>*/}
                                {/*            </div>*/}
                                {/*            <div*/}
                                {/*                className="progress"*/}
                                {/*                role="progressbar"*/}
                                {/*                aria-label="Basic example"*/}
                                {/*                aria-valuenow="2"*/}
                                {/*                aria-valuemin="0"*/}
                                {/*                aria-valuemax="100"*/}
                                {/*            >*/}
                                {/*                <div className="progress-bar" style={{ width: '2%' }}>*/}
                                {/*                    <span>2%</span>*/}
                                {/*                </div>*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*</div>*/}
                                {/*<div className="course-review ul_li mt-70">*/}
                                {/*    <div className="xb-item--avatar">*/}
                                {/*        <img src="assets/img/course/avatar3.jpg" alt="" />*/}
                                {/*    </div>*/}
                                {/*    <div className="xb-item--holder">*/}
                                {/*        <div className="ul_li mb-10">*/}
                                {/*            <h3 className="xb-item--name">Amanda Nicole</h3>*/}
                                {/*            <ul className="xb-star ul_li">*/}
                                {/*                <li>*/}
                                {/*                    <i className="fas fa-star"></i>*/}
                                {/*                </li>*/}
                                {/*                <li>*/}
                                {/*                    <i className="fas fa-star"></i>*/}
                                {/*                </li>*/}
                                {/*                <li>*/}
                                {/*                    <i className="fas fa-star"></i>*/}
                                {/*                </li>*/}
                                {/*                <li>*/}
                                {/*                    <i className="fas fa-star"></i>*/}
                                {/*                </li>*/}
                                {/*                <li>*/}
                                {/*                    <i className="fas fa-star"></i>*/}
                                {/*                </li>*/}
                                {/*            </ul>*/}
                                {/*        </div>*/}
                                {/*        <h4 className="xb-item--ttl">“ Outstanding Course ”</h4>*/}
                                {/*        <p className="xb-item--contact">*/}
                                {/*            "An exceptional course that not only deepened my knowledge but also enhanced my professional skills. The*/}
                                {/*            instructors were knowledgeable and supportive throughout the journey."*/}
                                {/*        </p>*/}
                                {/*    </div>*/}
                                {/*</div>*/}
                            </div>
                        </div>
                    </div>
                    <div className="course-bottom mt-85">
                        <h2>Option que tu peux aimer</h2>
                        <div className="row">
                            {mayLike.slice(0, 3).map((l) => (
                                <div className="col-lg-4 col-md-6 col-sm-6" key={l.id}>
                                    <div className="xb-program__wrapper mt-30">
                                        <div className="xb-item--img text-center">
                                            <Link href={route('courseShow', l.id)}>
                                                <img src={`/storage/${l.image}`} alt="" />
                                            </Link>
                                        </div>
                                        <div className="xb-item--holder">
                                            <div className="xb-item--deprt ul_li_between">
                                                <span className="xb-item--group"># {l.faculty.name}</span>
                                                <div className="xb-item--rating">
                                                    <span>4.5</span> <img src="/assets/img/icon/rating.png" alt="" />
                                                </div>
                                            </div>
                                            <h2 className="xb-item--title border-effect-2">
                                                <Link href={route('courseShow', l.id)}>{l.level_name}</Link>
                                            </h2>
                                            <ul className="xb-item--meta ul_li">
                                                <li>
                                                    <img src="/assets/img/icon/meta-icon01.png" alt="" />
                                                    {l.details.student_number} Places
                                                </li>
                                                <li>
                                                    <img src="/assets/img/icon/clock.png" alt="" />
                                                    {l.details.duration_years * 2} Semestres
                                                </li>
                                            </ul>
                                            <div className="xb-item--dep-btn">
                                                <Link href={route('courseShow', l.id)}>Voir</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </App>
    );
}
