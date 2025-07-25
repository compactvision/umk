import App from '@/components/layouts/Home/App';
import Breadcumb from '@/components/UI/home/Breadcumb';
import { usePage } from '@inertiajs/react';


export default function CoursShow() {
    const { course } = usePage().props;

    console.log(course)
    return (
        <App>
            <Breadcumb title={course.faculty.name} desc={course.level_name} />

            <section className="course-single pt-120 pb-120">
                <div className="container">
                    <div className="course-single-image">
                        <img src="assets/img/course/course_single.jpg" alt="" />
                    </div>
                    <div className="row mt-none-30 flex-row-reverse">
                        <div className="col-lg-4 mt-30">
                            <div className="course-sidebar">
                                <div className="course-sidebar__video pos-rel">
                                    <img src="assets/img/course/course_single2.jpg" alt="" />
                                    <a className="btn-video btn-video-center popup-video" href="https://www.youtube.com/watch?v=cRXm1p-CNyk">
                                        <i className="fas fa-play"></i>
                                    </a>
                                </div>
                                <h3 className="course-sidebar__title">Course Includes:</h3>
                                <ul className="course-sidebar__list list-border-none list-unstyled">
                                    <li>
                                        <div>
                                            <span>
                                                <img src="assets/img/icon/ci_01.svg" alt="" />
                                            </span>
                                            Price:<span className="price">$120</span>
                                        </div>
                                    </li>
                                    <li>
                                        <div>
                                            <span>
                                                <img src="assets/img/icon/ci_02.svg" alt="" />
                                            </span>
                                            Instructor:<span className="ml-10">David Martinez</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="assets/img/icon/ci_03.svg" alt="" />
                                            Duration:
                                        </span>
                                        <span>12 weeks</span>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="assets/img/icon/ci_04.svg" alt="" />
                                            Lessons:
                                        </span>
                                        <span>8</span>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="assets/img/icon/ci_05.svg" alt="" />
                                            Students:
                                        </span>
                                        <span>72</span>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="assets/img/icon/ci_06.svg" alt="" />
                                            Language:
                                        </span>
                                        <span>English</span>
                                    </li>
                                    <li>
                                        <span>
                                            <img src="assets/img/icon/ci_07.svg" alt="" />
                                            Certifications:
                                        </span>
                                        <span>Yes</span>
                                    </li>
                                </ul>
                                <div className="sidebar-btn mt-35">
                                    <a className="thm-btn" href="#!">
                                        buy now
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
                                    <h4>Share on : </h4>
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
                                            <div className="xb-item--avatar">
                                                <img src="assets/img/course/avatar.png" alt="" />
                                            </div>
                                            <div className="xb-item--holder">
                                                <span className="xb-item--title">Teacher</span>
                                                <h3 className="xb-item--desig">David Martinez</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="course-meta-item mt-30">
                                        <span className="xb-item--title">Category</span>
                                        <h3 className="xb-item--desig">Management</h3>
                                    </div>
                                    <div className="course-meta-item mt-30">
                                        <span className="xb-item--title">Review</span>
                                        <ul className="xb-star ul_li">
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <h2>MBA in Management, Strategic Leadership, and Innovation..</h2>
                                <h3>course description</h3>
                                <p>
                                    The MBA in Management, Strategic Leadership, and Innovation program at EduFord University is designed to equip
                                    future business leaders with the skills and knowledge necessary to excel in today's dynamic and complex business
                                    environment.This program offers a comprehensive curriculum that combines core management principles with advanced
                                    strategies in leadership and innovation.
                                </p>
                                <p>
                                    Whether you're looking to advance your career, transition into a leadership role, or launch your own business,
                                    this MBA program provides the tools succeed in the competitive world of business.
                                </p>
                                <h3 className="mt-60">What You'll Learn From This Course</h3>
                                <p>
                                    This course equips you with essential skills in strategic decision-making, leadership, and innovation. You’ll
                                    learn to navigate global markets, manage organizational change, and solve complex business challenges.
                                    Additionally, you'll enhance your communication.
                                </p>
                                <h3>What You'll Learn From This Course</h3>
                                <p>
                                    This course equips you with essential skills in strategic decision-making, leadership, and innovation. You’ll
                                    learn to navigate global markets, manage organizational change, and solve complex business challenges.
                                    Additionally, you'll enhance your communication.
                                </p>
                                <ul className="xb-list list-unstyled mb-55">
                                    <li>
                                        <span>
                                            <img src="assets/img/icon/check-2.svg" alt="" />
                                        </span>
                                        Make impactful decisions that drive success.
                                    </li>
                                    <li>
                                        <span>
                                            <img src="assets/img/icon/check-2.svg" alt="" />
                                        </span>
                                        Lead diverse teams and enhance performance.
                                    </li>
                                    <li>
                                        <span>
                                            <img src="assets/img/icon/check-2.svg" alt="" />
                                        </span>
                                        Cultivate and implement innovative ideas.
                                    </li>
                                    <li>
                                        <span>
                                            <img src="assets/img/icon/check-2.svg" alt="" />
                                        </span>
                                        Navigate global markets and cultural dynamics.
                                    </li>
                                </ul>
                                <h3>Study Options:</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Qualification</th>
                                            <th>Length</th>
                                            <th>Code</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Bsc (Hons)</td>
                                            <td>3 years full time</td>
                                            <td>CDX3</td>
                                        </tr>
                                        <tr>
                                            <td>Bsc</td>
                                            <td>4 years full time</td>
                                            <td>CDX4</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <h3>Course Curriculum</h3>
                                <div className="faq-inner course-faq mb-60">
                                    <ul className="accordion_box clearfix">
                                        <li className="accordion active-block block">
                                            <div className="acc-btn">
                                                <span className="arrow">
                                                    <i className="far fa-angle-down"></i>
                                                </span>
                                                Intro to Course and Hi study
                                                <span className="course-lesson">4 Lessons • 15m 10s</span>
                                            </div>
                                            <div className="acc_body current">
                                                <ul className="course-info">
                                                    <li className="ul_li_between">
                                                        <span className="xb-item--title">
                                                            <span>
                                                                <svg
                                                                    width="18"
                                                                    height="18"
                                                                    viewBox="0 0 18 18"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M6.67773 9.00053V7.81653C6.67773 6.28853 7.75773 5.67253 9.07773 6.43253L10.1017 7.02453L11.1257 7.61653C12.4457 8.37653 12.4457 9.62453 11.1257 10.3845L10.1017 10.9765L9.07773 11.5685C7.75773 12.3285 6.67773 11.7045 6.67773 10.1845V9.00053Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-miterlimit="10"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M9 17.0001C13.4183 17.0001 17 13.4184 17 9.00012C17 4.58184 13.4183 1.00012 9 1.00012C4.58172 1.00012 1 4.58184 1 9.00012C1 13.4184 4.58172 17.0001 9 17.0001Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                            <span>Video:</span>Course Intro
                                                        </span>
                                                        <div className="xb-item--rgiht">
                                                            <span className="xb-item--duration">28 min</span>
                                                            <a className="xb-item--preview" href="#!">
                                                                <svg
                                                                    width="17"
                                                                    height="12"
                                                                    viewBox="0 0 17 12"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M15.2902 5.76164C15.503 6.06006 15.6094 6.20927 15.6094 6.43015C15.6094 6.65102 15.503 6.80023 15.2902 7.09866C14.3339 8.43954 11.8919 11.3302 8.60938 11.3302C5.32693 11.3302 2.88484 8.43954 1.9286 7.09866C1.71578 6.80023 1.60938 6.65102 1.60938 6.43015C1.60938 6.20927 1.71578 6.06006 1.9286 5.76164C2.88484 4.42076 5.32692 1.53015 8.60938 1.53015C11.8919 1.53015 14.3339 4.42076 15.2902 5.76164Z"
                                                                        stroke="#170006"
                                                                        stroke-width="1.2"
                                                                    />
                                                                    <path
                                                                        d="M10.7078 6.42996C10.7078 5.27016 9.76761 4.32996 8.60781 4.32996C7.44801 4.32996 6.50781 5.27016 6.50781 6.42996C6.50781 7.58976 7.44801 8.52996 8.60781 8.52996C9.76761 8.52996 10.7078 7.58976 10.7078 6.42996Z"
                                                                        stroke="#170006"
                                                                        stroke-width="1.2"
                                                                    />
                                                                </svg>
                                                                Preview
                                                            </a>
                                                        </div>
                                                    </li>
                                                    <li className="ul_li_between">
                                                        <span className="xb-item--title">
                                                            <span>
                                                                <svg
                                                                    width="18"
                                                                    height="18"
                                                                    viewBox="0 0 18 18"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M6.67773 9.00053V7.81653C6.67773 6.28853 7.75773 5.67253 9.07773 6.43253L10.1017 7.02453L11.1257 7.61653C12.4457 8.37653 12.4457 9.62453 11.1257 10.3845L10.1017 10.9765L9.07773 11.5685C7.75773 12.3285 6.67773 11.7045 6.67773 10.1845V9.00053Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-miterlimit="10"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M9 17.0001C13.4183 17.0001 17 13.4184 17 9.00012C17 4.58184 13.4183 1.00012 9 1.00012C4.58172 1.00012 1 4.58184 1 9.00012C1 13.4184 4.58172 17.0001 9 17.0001Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                            <span>Video:</span>Course Intro
                                                        </span>
                                                        <div className="xb-item--rgiht">
                                                            <span className="xb-item--duration">28 min</span>
                                                            <a className="xb-item--preview" href="#!">
                                                                <svg
                                                                    width="17"
                                                                    height="12"
                                                                    viewBox="0 0 17 12"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M15.2902 5.76164C15.503 6.06006 15.6094 6.20927 15.6094 6.43015C15.6094 6.65102 15.503 6.80023 15.2902 7.09866C14.3339 8.43954 11.8919 11.3302 8.60938 11.3302C5.32693 11.3302 2.88484 8.43954 1.9286 7.09866C1.71578 6.80023 1.60938 6.65102 1.60938 6.43015C1.60938 6.20927 1.71578 6.06006 1.9286 5.76164C2.88484 4.42076 5.32692 1.53015 8.60938 1.53015C11.8919 1.53015 14.3339 4.42076 15.2902 5.76164Z"
                                                                        stroke="#170006"
                                                                        stroke-width="1.2"
                                                                    />
                                                                    <path
                                                                        d="M10.7078 6.42996C10.7078 5.27016 9.76761 4.32996 8.60781 4.32996C7.44801 4.32996 6.50781 5.27016 6.50781 6.42996C6.50781 7.58976 7.44801 8.52996 8.60781 8.52996C9.76761 8.52996 10.7078 7.58976 10.7078 6.42996Z"
                                                                        stroke="#170006"
                                                                        stroke-width="1.2"
                                                                    />
                                                                </svg>
                                                                Preview
                                                            </a>
                                                        </div>
                                                    </li>
                                                    <li className="ul_li_between">
                                                        <span className="xb-item--title">
                                                            <span>
                                                                <svg
                                                                    width="16"
                                                                    height="16"
                                                                    viewBox="0 0 16 16"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M1 12.6667V8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8V12.6667"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M15 13.4444C15 13.857 14.8361 14.2527 14.5444 14.5444C14.2527 14.8361 13.857 15 13.4444 15H12.6667C12.2541 15 11.8584 14.8361 11.5667 14.5444C11.275 14.2527 11.1111 13.857 11.1111 13.4444V11.1111C11.1111 10.6985 11.275 10.3029 11.5667 10.0112C11.8584 9.71943 12.2541 9.55554 12.6667 9.55554H15V13.4444ZM1 13.4444C1 13.857 1.16389 14.2527 1.45561 14.5444C1.74733 14.8361 2.143 15 2.55556 15H3.33333C3.74589 15 4.14155 14.8361 4.43328 14.5444C4.725 14.2527 4.88889 13.857 4.88889 13.4444V11.1111C4.88889 10.6985 4.725 10.3029 4.43328 10.0112C4.14155 9.71943 3.74589 9.55554 3.33333 9.55554H1V13.4444Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                            <span>Video:</span>Strategic Leadership, and Innovation
                                                        </span>
                                                        <div className="xb-item--rgiht">
                                                            <span className="xb-item--duration">28 min</span>
                                                            <span className="xb-item--loack">
                                                                <svg
                                                                    width="15"
                                                                    height="17"
                                                                    viewBox="0 0 15 17"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M1.80469 7.99981C1.80469 8.66256 2.34194 9.19981 3.00469 9.19981C3.66743 9.19981 4.20469 8.66256 4.20469 7.99981H1.80469ZM10.8044 7.99981C10.8044 8.66256 11.3416 9.19981 12.0044 9.19981C12.6671 9.19981 13.2044 8.66256 13.2044 7.99981H10.8044ZM4.20469 7.99981V6.49987H1.80469V7.99981H4.20469ZM4.20469 6.49987C4.20469 5.33046 4.39267 4.55631 4.78292 4.07184C5.12802 3.64342 5.83496 3.20005 7.50451 3.20005V0.800049C5.4242 0.800049 3.88123 1.36539 2.91388 2.56628C1.99169 3.71112 1.80469 5.18688 1.80469 6.49987H4.20469ZM7.50451 3.20005C9.17405 3.20005 9.881 3.64342 10.2261 4.07184C10.6164 4.55631 10.8044 5.33046 10.8044 6.49987H13.2044C13.2044 5.18688 13.0173 3.71112 12.0952 2.56628C11.1278 1.36539 9.58482 0.800049 7.50451 0.800049V3.20005ZM10.8044 6.49987V7.99981H13.2044V6.49987H10.8044Z"
                                                                        fill="#4F5158"
                                                                    />
                                                                    <path
                                                                        d="M8.77446 12.4997C8.77446 13.2038 8.20366 13.7746 7.49954 13.7746C6.79541 13.7746 6.22461 13.2038 6.22461 12.4997C6.22461 11.7955 6.79541 11.2247 7.49954 11.2247C8.20366 11.2247 8.77446 11.7955 8.77446 12.4997Z"
                                                                        stroke="#4F5158"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M11.2492 16.4001H3.74946C2.24523 16.4001 1.54552 16.1976 1.17384 15.8259C0.80217 15.4542 0.599609 14.7545 0.599609 13.2503V11.7503C0.599609 10.2461 0.80217 9.54637 1.17384 9.17469C1.54552 8.80302 2.24523 8.60046 3.74946 8.60046H11.2492C12.7534 8.60046 13.4531 8.80302 13.8248 9.17469C14.1964 9.54637 14.399 10.2461 14.399 11.7503V13.2503C14.399 14.7545 14.1964 15.4542 13.8248 15.8259C13.4531 16.1976 12.7534 16.4001 11.2492 16.4001Z"
                                                                        stroke="#4F5158"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    </li>
                                                    <li className="ul_li_between">
                                                        <span className="xb-item--title">
                                                            <span>
                                                                <svg
                                                                    width="16"
                                                                    height="19"
                                                                    viewBox="0 0 16 19"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M1 7.82993C1 4.81294 1 3.30445 1.99584 2.36719C2.99167 1.42993 4.59445 1.42993 7.8 1.42993H8.41818C11.0271 1.42993 12.3316 1.42993 13.2375 2.0682C13.4971 2.25107 13.7275 2.46795 13.9218 2.71224C14.6 3.56487 14.6 4.79262 14.6 7.24811V9.28448C14.6 11.655 14.6 12.8403 14.2249 13.7869C13.6217 15.3088 12.3463 16.5092 10.7293 17.0768C9.7235 17.4299 8.46415 17.4299 5.94545 17.4299C4.5062 17.4299 3.78657 17.4299 3.21182 17.2281C2.28783 16.9038 1.559 16.2178 1.21437 15.3482C1 14.8072 1 14.1299 1 12.7754V7.82993Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M14.6016 9.42993C14.6016 10.9027 13.4077 12.0966 11.9349 12.0966C11.4023 12.0966 10.7743 12.0032 10.2565 12.142C9.79635 12.2653 9.43695 12.6247 9.31366 13.0848C9.1749 13.6027 9.26823 14.2306 9.26823 14.7632C9.26823 16.236 8.07432 17.4299 6.60156 17.4299"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M4.60156 5.42993H10.2016"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M4.60156 8.63013H7.00156"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                            <span>Reading::</span>Strategic Leadership, and Innovation
                                                        </span>
                                                        <div className="xb-item--rgiht">
                                                            <span className="xb-item--duration">28 min</span>
                                                            <span className="xb-item--loack">
                                                                <svg
                                                                    width="15"
                                                                    height="17"
                                                                    viewBox="0 0 15 17"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M1.80469 7.99981C1.80469 8.66256 2.34194 9.19981 3.00469 9.19981C3.66743 9.19981 4.20469 8.66256 4.20469 7.99981H1.80469ZM10.8044 7.99981C10.8044 8.66256 11.3416 9.19981 12.0044 9.19981C12.6671 9.19981 13.2044 8.66256 13.2044 7.99981H10.8044ZM4.20469 7.99981V6.49987H1.80469V7.99981H4.20469ZM4.20469 6.49987C4.20469 5.33046 4.39267 4.55631 4.78292 4.07184C5.12802 3.64342 5.83496 3.20005 7.50451 3.20005V0.800049C5.4242 0.800049 3.88123 1.36539 2.91388 2.56628C1.99169 3.71112 1.80469 5.18688 1.80469 6.49987H4.20469ZM7.50451 3.20005C9.17405 3.20005 9.881 3.64342 10.2261 4.07184C10.6164 4.55631 10.8044 5.33046 10.8044 6.49987H13.2044C13.2044 5.18688 13.0173 3.71112 12.0952 2.56628C11.1278 1.36539 9.58482 0.800049 7.50451 0.800049V3.20005ZM10.8044 6.49987V7.99981H13.2044V6.49987H10.8044Z"
                                                                        fill="#4F5158"
                                                                    />
                                                                    <path
                                                                        d="M8.77446 12.4997C8.77446 13.2038 8.20366 13.7746 7.49954 13.7746C6.79541 13.7746 6.22461 13.2038 6.22461 12.4997C6.22461 11.7955 6.79541 11.2247 7.49954 11.2247C8.20366 11.2247 8.77446 11.7955 8.77446 12.4997Z"
                                                                        stroke="#4F5158"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M11.2492 16.4001H3.74946C2.24523 16.4001 1.54552 16.1976 1.17384 15.8259C0.80217 15.4542 0.599609 14.7545 0.599609 13.2503V11.7503C0.599609 10.2461 0.80217 9.54637 1.17384 9.17469C1.54552 8.80302 2.24523 8.60046 3.74946 8.60046H11.2492C12.7534 8.60046 13.4531 8.80302 13.8248 9.17469C14.1964 9.54637 14.399 10.2461 14.399 11.7503V13.2503C14.399 14.7545 14.1964 15.4542 13.8248 15.8259C13.4531 16.1976 12.7534 16.4001 11.2492 16.4001Z"
                                                                        stroke="#4F5158"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                        </li>
                                        <li className="accordion block">
                                            <div className="acc-btn">
                                                <span className="arrow">
                                                    <i className="far fa-angle-down"></i>
                                                </span>
                                                Intro to Course and Hi study
                                                <span className="course-lesson">4 Lessons • 15m 10s</span>
                                            </div>
                                            <div className="acc_body">
                                                <ul className="course-info">
                                                    <li className="ul_li_between">
                                                        <span className="xb-item--title">
                                                            <span>
                                                                <svg
                                                                    width="18"
                                                                    height="18"
                                                                    viewBox="0 0 18 18"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M6.67773 9.00053V7.81653C6.67773 6.28853 7.75773 5.67253 9.07773 6.43253L10.1017 7.02453L11.1257 7.61653C12.4457 8.37653 12.4457 9.62453 11.1257 10.3845L10.1017 10.9765L9.07773 11.5685C7.75773 12.3285 6.67773 11.7045 6.67773 10.1845V9.00053Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-miterlimit="10"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M9 17.0001C13.4183 17.0001 17 13.4184 17 9.00012C17 4.58184 13.4183 1.00012 9 1.00012C4.58172 1.00012 1 4.58184 1 9.00012C1 13.4184 4.58172 17.0001 9 17.0001Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                            <span>Video:</span>Course Intro
                                                        </span>
                                                        <div className="xb-item--rgiht">
                                                            <span className="xb-item--duration">28 min</span>
                                                            <a className="xb-item--preview" href="#!">
                                                                <svg
                                                                    width="17"
                                                                    height="12"
                                                                    viewBox="0 0 17 12"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M15.2902 5.76164C15.503 6.06006 15.6094 6.20927 15.6094 6.43015C15.6094 6.65102 15.503 6.80023 15.2902 7.09866C14.3339 8.43954 11.8919 11.3302 8.60938 11.3302C5.32693 11.3302 2.88484 8.43954 1.9286 7.09866C1.71578 6.80023 1.60938 6.65102 1.60938 6.43015C1.60938 6.20927 1.71578 6.06006 1.9286 5.76164C2.88484 4.42076 5.32692 1.53015 8.60938 1.53015C11.8919 1.53015 14.3339 4.42076 15.2902 5.76164Z"
                                                                        stroke="#170006"
                                                                        stroke-width="1.2"
                                                                    />
                                                                    <path
                                                                        d="M10.7078 6.42996C10.7078 5.27016 9.76761 4.32996 8.60781 4.32996C7.44801 4.32996 6.50781 5.27016 6.50781 6.42996C6.50781 7.58976 7.44801 8.52996 8.60781 8.52996C9.76761 8.52996 10.7078 7.58976 10.7078 6.42996Z"
                                                                        stroke="#170006"
                                                                        stroke-width="1.2"
                                                                    />
                                                                </svg>
                                                                Preview
                                                            </a>
                                                        </div>
                                                    </li>
                                                    <li className="ul_li_between">
                                                        <span className="xb-item--title">
                                                            <span>
                                                                <svg
                                                                    width="18"
                                                                    height="18"
                                                                    viewBox="0 0 18 18"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M6.67773 9.00053V7.81653C6.67773 6.28853 7.75773 5.67253 9.07773 6.43253L10.1017 7.02453L11.1257 7.61653C12.4457 8.37653 12.4457 9.62453 11.1257 10.3845L10.1017 10.9765L9.07773 11.5685C7.75773 12.3285 6.67773 11.7045 6.67773 10.1845V9.00053Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-miterlimit="10"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M9 17.0001C13.4183 17.0001 17 13.4184 17 9.00012C17 4.58184 13.4183 1.00012 9 1.00012C4.58172 1.00012 1 4.58184 1 9.00012C1 13.4184 4.58172 17.0001 9 17.0001Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                            <span>Video:</span>Course Intro
                                                        </span>
                                                        <div className="xb-item--rgiht">
                                                            <span className="xb-item--duration">28 min</span>
                                                            <a className="xb-item--preview" href="#!">
                                                                <svg
                                                                    width="17"
                                                                    height="12"
                                                                    viewBox="0 0 17 12"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M15.2902 5.76164C15.503 6.06006 15.6094 6.20927 15.6094 6.43015C15.6094 6.65102 15.503 6.80023 15.2902 7.09866C14.3339 8.43954 11.8919 11.3302 8.60938 11.3302C5.32693 11.3302 2.88484 8.43954 1.9286 7.09866C1.71578 6.80023 1.60938 6.65102 1.60938 6.43015C1.60938 6.20927 1.71578 6.06006 1.9286 5.76164C2.88484 4.42076 5.32692 1.53015 8.60938 1.53015C11.8919 1.53015 14.3339 4.42076 15.2902 5.76164Z"
                                                                        stroke="#170006"
                                                                        stroke-width="1.2"
                                                                    />
                                                                    <path
                                                                        d="M10.7078 6.42996C10.7078 5.27016 9.76761 4.32996 8.60781 4.32996C7.44801 4.32996 6.50781 5.27016 6.50781 6.42996C6.50781 7.58976 7.44801 8.52996 8.60781 8.52996C9.76761 8.52996 10.7078 7.58976 10.7078 6.42996Z"
                                                                        stroke="#170006"
                                                                        stroke-width="1.2"
                                                                    />
                                                                </svg>
                                                                Preview
                                                            </a>
                                                        </div>
                                                    </li>
                                                    <li className="ul_li_between">
                                                        <span className="xb-item--title">
                                                            <span>
                                                                <svg
                                                                    width="16"
                                                                    height="16"
                                                                    viewBox="0 0 16 16"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M1 12.6667V8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8V12.6667"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M15 13.4444C15 13.857 14.8361 14.2527 14.5444 14.5444C14.2527 14.8361 13.857 15 13.4444 15H12.6667C12.2541 15 11.8584 14.8361 11.5667 14.5444C11.275 14.2527 11.1111 13.857 11.1111 13.4444V11.1111C11.1111 10.6985 11.275 10.3029 11.5667 10.0112C11.8584 9.71943 12.2541 9.55554 12.6667 9.55554H15V13.4444ZM1 13.4444C1 13.857 1.16389 14.2527 1.45561 14.5444C1.74733 14.8361 2.143 15 2.55556 15H3.33333C3.74589 15 4.14155 14.8361 4.43328 14.5444C4.725 14.2527 4.88889 13.857 4.88889 13.4444V11.1111C4.88889 10.6985 4.725 10.3029 4.43328 10.0112C4.14155 9.71943 3.74589 9.55554 3.33333 9.55554H1V13.4444Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                            <span>Video:</span>Strategic Leadership, and Innovation
                                                        </span>
                                                        <div className="xb-item--rgiht">
                                                            <span className="xb-item--duration">28 min</span>
                                                            <span className="xb-item--loack">
                                                                <svg
                                                                    width="15"
                                                                    height="17"
                                                                    viewBox="0 0 15 17"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M1.80469 7.99981C1.80469 8.66256 2.34194 9.19981 3.00469 9.19981C3.66743 9.19981 4.20469 8.66256 4.20469 7.99981H1.80469ZM10.8044 7.99981C10.8044 8.66256 11.3416 9.19981 12.0044 9.19981C12.6671 9.19981 13.2044 8.66256 13.2044 7.99981H10.8044ZM4.20469 7.99981V6.49987H1.80469V7.99981H4.20469ZM4.20469 6.49987C4.20469 5.33046 4.39267 4.55631 4.78292 4.07184C5.12802 3.64342 5.83496 3.20005 7.50451 3.20005V0.800049C5.4242 0.800049 3.88123 1.36539 2.91388 2.56628C1.99169 3.71112 1.80469 5.18688 1.80469 6.49987H4.20469ZM7.50451 3.20005C9.17405 3.20005 9.881 3.64342 10.2261 4.07184C10.6164 4.55631 10.8044 5.33046 10.8044 6.49987H13.2044C13.2044 5.18688 13.0173 3.71112 12.0952 2.56628C11.1278 1.36539 9.58482 0.800049 7.50451 0.800049V3.20005ZM10.8044 6.49987V7.99981H13.2044V6.49987H10.8044Z"
                                                                        fill="#4F5158"
                                                                    />
                                                                    <path
                                                                        d="M8.77446 12.4997C8.77446 13.2038 8.20366 13.7746 7.49954 13.7746C6.79541 13.7746 6.22461 13.2038 6.22461 12.4997C6.22461 11.7955 6.79541 11.2247 7.49954 11.2247C8.20366 11.2247 8.77446 11.7955 8.77446 12.4997Z"
                                                                        stroke="#4F5158"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M11.2492 16.4001H3.74946C2.24523 16.4001 1.54552 16.1976 1.17384 15.8259C0.80217 15.4542 0.599609 14.7545 0.599609 13.2503V11.7503C0.599609 10.2461 0.80217 9.54637 1.17384 9.17469C1.54552 8.80302 2.24523 8.60046 3.74946 8.60046H11.2492C12.7534 8.60046 13.4531 8.80302 13.8248 9.17469C14.1964 9.54637 14.399 10.2461 14.399 11.7503V13.2503C14.399 14.7545 14.1964 15.4542 13.8248 15.8259C13.4531 16.1976 12.7534 16.4001 11.2492 16.4001Z"
                                                                        stroke="#4F5158"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    </li>
                                                    <li className="ul_li_between">
                                                        <span className="xb-item--title">
                                                            <span>
                                                                <svg
                                                                    width="16"
                                                                    height="19"
                                                                    viewBox="0 0 16 19"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M1 7.82993C1 4.81294 1 3.30445 1.99584 2.36719C2.99167 1.42993 4.59445 1.42993 7.8 1.42993H8.41818C11.0271 1.42993 12.3316 1.42993 13.2375 2.0682C13.4971 2.25107 13.7275 2.46795 13.9218 2.71224C14.6 3.56487 14.6 4.79262 14.6 7.24811V9.28448C14.6 11.655 14.6 12.8403 14.2249 13.7869C13.6217 15.3088 12.3463 16.5092 10.7293 17.0768C9.7235 17.4299 8.46415 17.4299 5.94545 17.4299C4.5062 17.4299 3.78657 17.4299 3.21182 17.2281C2.28783 16.9038 1.559 16.2178 1.21437 15.3482C1 14.8072 1 14.1299 1 12.7754V7.82993Z"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M14.6016 9.42993C14.6016 10.9027 13.4077 12.0966 11.9349 12.0966C11.4023 12.0966 10.7743 12.0032 10.2565 12.142C9.79635 12.2653 9.43695 12.6247 9.31366 13.0848C9.1749 13.6027 9.26823 14.2306 9.26823 14.7632C9.26823 16.236 8.07432 17.4299 6.60156 17.4299"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M4.60156 5.42993H10.2016"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M4.60156 8.63013H7.00156"
                                                                        stroke="#5C5C54"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                            <span>Reading::</span>Strategic Leadership, and Innovation
                                                        </span>
                                                        <div className="xb-item--rgiht">
                                                            <span className="xb-item--duration">28 min</span>
                                                            <span className="xb-item--loack">
                                                                <svg
                                                                    width="15"
                                                                    height="17"
                                                                    viewBox="0 0 15 17"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M1.80469 7.99981C1.80469 8.66256 2.34194 9.19981 3.00469 9.19981C3.66743 9.19981 4.20469 8.66256 4.20469 7.99981H1.80469ZM10.8044 7.99981C10.8044 8.66256 11.3416 9.19981 12.0044 9.19981C12.6671 9.19981 13.2044 8.66256 13.2044 7.99981H10.8044ZM4.20469 7.99981V6.49987H1.80469V7.99981H4.20469ZM4.20469 6.49987C4.20469 5.33046 4.39267 4.55631 4.78292 4.07184C5.12802 3.64342 5.83496 3.20005 7.50451 3.20005V0.800049C5.4242 0.800049 3.88123 1.36539 2.91388 2.56628C1.99169 3.71112 1.80469 5.18688 1.80469 6.49987H4.20469ZM7.50451 3.20005C9.17405 3.20005 9.881 3.64342 10.2261 4.07184C10.6164 4.55631 10.8044 5.33046 10.8044 6.49987H13.2044C13.2044 5.18688 13.0173 3.71112 12.0952 2.56628C11.1278 1.36539 9.58482 0.800049 7.50451 0.800049V3.20005ZM10.8044 6.49987V7.99981H13.2044V6.49987H10.8044Z"
                                                                        fill="#4F5158"
                                                                    />
                                                                    <path
                                                                        d="M8.77446 12.4997C8.77446 13.2038 8.20366 13.7746 7.49954 13.7746C6.79541 13.7746 6.22461 13.2038 6.22461 12.4997C6.22461 11.7955 6.79541 11.2247 7.49954 11.2247C8.20366 11.2247 8.77446 11.7955 8.77446 12.4997Z"
                                                                        stroke="#4F5158"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                    <path
                                                                        d="M11.2492 16.4001H3.74946C2.24523 16.4001 1.54552 16.1976 1.17384 15.8259C0.80217 15.4542 0.599609 14.7545 0.599609 13.2503V11.7503C0.599609 10.2461 0.80217 9.54637 1.17384 9.17469C1.54552 8.80302 2.24523 8.60046 3.74946 8.60046H11.2492C12.7534 8.60046 13.4531 8.80302 13.8248 9.17469C14.1964 9.54637 14.399 10.2461 14.399 11.7503V13.2503C14.399 14.7545 14.1964 15.4542 13.8248 15.8259C13.4531 16.1976 12.7534 16.4001 11.2492 16.4001Z"
                                                                        stroke="#4F5158"
                                                                        stroke-width="1.2"
                                                                        stroke-linecap="round"
                                                                        stroke-linejoin="round"
                                                                    />
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <h3>Your Instructors</h3>
                                <div className="admin-info ul_li mb-65">
                                    <div className="xb-item--avatar">
                                        <img src="assets/img/course/avatar2.jpg" alt="" />
                                    </div>
                                    <div className="xb-item--holder">
                                        <h3 className="xb-item--name">david martinez</h3>
                                        <span className="xb-item--desig">Management Instructor</span>
                                        <ul className="xb-item--meta ul_li">
                                            <li>
                                                <i className="fas fa-star"></i>4.7 Rating
                                            </li>
                                            <li>
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M5.61133 7.50075V6.53875C5.61133 5.29725 6.48883 4.79675 7.56133 5.41425L8.39333 5.89525L9.22533 6.37625C10.2978 6.99375 10.2978 8.00775 9.22533 8.62525L8.39333 9.10625L7.56133 9.58725C6.48883 10.2048 5.61133 9.69775 5.61133 8.46275V7.50075Z"
                                                        stroke="#5C5C54"
                                                        stroke-width="1.2"
                                                        stroke-miterlimit="10"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                    />
                                                    <path
                                                        d="M7.5 14C11.0899 14 14 11.0899 14 7.5C14 3.91015 11.0899 1 7.5 1C3.91015 1 1 3.91015 1 7.5C1 11.0899 3.91015 14 7.5 14Z"
                                                        stroke="#5C5C54"
                                                        stroke-width="1.2"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                    />
                                                </svg>
                                                58 Courses
                                            </li>
                                            <li>
                                                <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M6.57111 7.5C8.36216 7.5 9.81407 6.04493 9.81407 4.25C9.81407 2.45507 8.36216 1 6.57111 1C4.78006 1 3.32812 2.45507 3.32812 4.25C3.32812 6.04493 4.78006 7.5 6.57111 7.5Z"
                                                        stroke="#5C5C54"
                                                        stroke-width="1.2"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                    />
                                                    <path
                                                        d="M12.1429 14C12.1429 11.4845 9.64577 9.44995 6.57143 9.44995C3.49709 9.44995 1 11.4845 1 14"
                                                        stroke="#5C5C54"
                                                        stroke-width="1.2"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                    />
                                                </svg>
                                                45 Student
                                            </li>
                                        </ul>
                                        <p>
                                            With 15 years in business and 10 years of teaching, our instructor excels in strategic planning and
                                            leadership.
                                        </p>
                                        <ul className="xb-social ul_li mt-30">
                                            <li>
                                                <a href="#!">
                                                    <i className="fab fa-facebook-f"></i>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="#!">
                                                    <i className="fab fa-linkedin-in"></i>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="#!">
                                                    <i className="fab fa-pinterest-p"></i>
                                                </a>
                                            </li>
                                            <li>
                                                <a href="#!">
                                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path
                                                            d="M9.52217 6.77491L15.4785 0H14.0671L8.89516 5.88256L4.76437 0H0L6.24656 8.89547L0 16H1.41155L6.87321 9.78782L11.2356 16H16L9.52183 6.77491H9.52217ZM7.58887 8.97384L6.95596 8.08805L1.92015 1.03974H4.0882L8.15216 6.72795L8.78507 7.61374L14.0677 15.0075H11.8997L7.58887 8.97418V8.97384Z"
                                                            fill="#161A2C"
                                                        />
                                                    </svg>
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <h3>Ratings & Reviews</h3>
                                <div className="course-review-info ul_li">
                                    <div className="xb-item--review">
                                        <h2 className="xb-item--review-number">4.8</h2>
                                        <ul className="xb-star ul_li_center">
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                            <li>
                                                <i className="fas fa-star"></i>
                                            </li>
                                        </ul>
                                        <span className="xb-item--rating-text">1 rating</span>
                                    </div>
                                    <div className="xb-item--progress">
                                        <div className="xb-item--progress-item">
                                            <div className="xb-item--rating ul_li">
                                                <span>5</span>
                                                <i className="fas fa-star"></i>
                                            </div>
                                            <div
                                                className="progress"
                                                role="progressbar"
                                                aria-label="Example with label"
                                                aria-valuenow="95"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                                <div className="progress-bar" style={{ width: '95%' }}>
                                                    <span>25%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="xb-item--progress-item">
                                            <div className="xb-item--rating ul_li">
                                                <span>4</span>
                                                <i className="fas fa-star"></i>
                                            </div>
                                            <div
                                                className="progress"
                                                role="progressbar"
                                                aria-label="Basic example"
                                                aria-valuenow="26"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                                <div className="progress-bar" style={{ width: '26%' }}>
                                                    <span>26%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="xb-item--progress-item">
                                            <div className="xb-item--rating ul_li">
                                                <span>3</span>
                                                <i className="fas fa-star"></i>
                                            </div>
                                            <div
                                                className="progress"
                                                role="progressbar"
                                                aria-label="Basic example"
                                                aria-valuenow="15"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                                <div className="progress-bar" style={{ width: '15%' }}>
                                                    <span>15%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="xb-item--progress-item">
                                            <div className="xb-item--rating ul_li">
                                                <span>2</span>
                                                <i className="fas fa-star-half-alt"></i>
                                            </div>
                                            <div
                                                className="progress"
                                                role="progressbar"
                                                aria-label="Basic example"
                                                aria-valuenow="7"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                                <div className="progress-bar" style={{ width: '7%' }}>
                                                    <span>7%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="xb-item--progress-item">
                                            <div className="xb-item--rating ul_li">
                                                <span>1</span>
                                                <i className="fas fa-star-half-alt"></i>
                                            </div>
                                            <div
                                                className="progress"
                                                role="progressbar"
                                                aria-label="Basic example"
                                                aria-valuenow="2"
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                                <div className="progress-bar" style={{ width: '2%' }}>
                                                    <span>2%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="course-review ul_li mt-70">
                                    <div className="xb-item--avatar">
                                        <img src="assets/img/course/avatar3.jpg" alt="" />
                                    </div>
                                    <div className="xb-item--holder">
                                        <div className="ul_li mb-10">
                                            <h3 className="xb-item--name">Amanda Nicole</h3>
                                            <ul className="xb-star ul_li">
                                                <li>
                                                    <i className="fas fa-star"></i>
                                                </li>
                                                <li>
                                                    <i className="fas fa-star"></i>
                                                </li>
                                                <li>
                                                    <i className="fas fa-star"></i>
                                                </li>
                                                <li>
                                                    <i className="fas fa-star"></i>
                                                </li>
                                                <li>
                                                    <i className="fas fa-star"></i>
                                                </li>
                                            </ul>
                                        </div>
                                        <h4 className="xb-item--ttl">“ Outstanding Course ”</h4>
                                        <p className="xb-item--contact">
                                            "An exceptional course that not only deepened my knowledge but also enhanced my professional skills. The
                                            instructors were knowledgeable and supportive throughout the journey."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="course-bottom mt-85">
                        <h2>Courses You May Like</h2>
                        <div className="row">
                            <div className="col-lg-4 col-md-6 col-sm-6">
                                <div className="xb-program__wrapper mt-30">
                                    <div className="xb-item--img text-center">
                                        <a href="#!">
                                            <img src="assets/img/program/pro-img02.png" alt="" />
                                        </a>
                                    </div>
                                    <div className="xb-item--holder">
                                        <div className="xb-item--deprt ul_li_between">
                                            <span className="xb-item--group"># Management</span>
                                            <div className="xb-item--rating">
                                                <span>4.5</span> <img src="assets/img/icon/rating.png" alt="" />
                                            </div>
                                        </div>
                                        <h2 className="xb-item--title border-effect-2">
                                            <a href="#!">MBA in Mechanical Engineering..</a>
                                        </h2>
                                        <ul className="xb-item--meta ul_li">
                                            <li>
                                                <img src="assets/img/icon/meta-icon01.png" alt="" />
                                                250 Seat
                                            </li>
                                            <li>
                                                <img src="assets/img/icon/clock.png" alt="" />
                                                14 Semester
                                            </li>
                                        </ul>
                                        <div className="xb-item--dep-btn">
                                            <a href="#!">enroll now</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-6">
                                <div className="xb-program__wrapper mt-30">
                                    <div className="xb-item--img text-center">
                                        <a href="#!">
                                            <img src="assets/img/program/pro-img03.png" alt="" />
                                        </a>
                                    </div>
                                    <div className="xb-item--holder">
                                        <div className="xb-item--deprt ul_li_between">
                                            <span className="xb-item--group"># Construction</span>
                                            <div className="xb-item--rating">
                                                <span>5.0</span> <img src="assets/img/icon/rating.png" alt="" />
                                            </div>
                                        </div>
                                        <h2 className="xb-item--title border-effect-2">
                                            <a href="#!">MBA in Management and Strategic..</a>
                                        </h2>
                                        <ul className="xb-item--meta ul_li">
                                            <li>
                                                <img src="assets/img/icon/meta-icon01.png" alt="" />
                                                280 Seat
                                            </li>
                                            <li>
                                                <img src="assets/img/icon/clock.png" alt="" />
                                                14 Semester
                                            </li>
                                        </ul>
                                        <div className="xb-item--dep-btn">
                                            <a href="#!">enroll now</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-6 col-sm-6">
                                <div className="xb-program__wrapper mt-30">
                                    <div className="xb-item--img text-center">
                                        <a href="#!">
                                            <img src="assets/img/program/pro-img04.png" alt="" />
                                        </a>
                                    </div>
                                    <div className="xb-item--holder">
                                        <div className="xb-item--deprt ul_li_between">
                                            <span className="xb-item--group"># Engineering</span>
                                            <div className="xb-item--rating">
                                                <span>5.0</span> <img src="assets/img/icon/rating.png" alt="" />
                                            </div>
                                        </div>
                                        <h2 className="xb-item--title border-effect-2">
                                            <a href="#!">MBA in Real Estate and Urban..</a>
                                        </h2>
                                        <ul className="xb-item--meta ul_li">
                                            <li>
                                                <img src="assets/img/icon/meta-icon01.png" alt="" />
                                                220 Seat
                                            </li>
                                            <li>
                                                <img src="assets/img/icon/clock.png" alt="" />
                                                14 Semester
                                            </li>
                                        </ul>
                                        <div className="xb-item--dep-btn">
                                            <a href="#!">enroll now</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </App>
    );
}
