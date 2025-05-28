import { useEffect } from 'react';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export default function Header() {
    useEffect(() => {
        // === Sticky Header ===
        function stickyHeader() {
            let scrollDirection = '';
            let lastScrollPosition = 0;

            if ($('.xb-header').length) {
                $('.xb-header')
                    .addClass('original')
                    .clone(true)
                    .insertAfter('.xb-header')
                    .addClass('xb-header-area-sticky xb-sticky-stt')
                    .removeClass('original');
            }

            $(window).on('scroll', function () {
                const currentScrollPosition = $(window).scrollTop();
                scrollDirection = currentScrollPosition < lastScrollPosition ? 'up' : 'down';
                lastScrollPosition = currentScrollPosition;

                if ($('#xb-header-area').hasClass('is-sticky')) {
                    if (lastScrollPosition > 100) {
                        $('.xb-header-area-sticky.xb-sticky-stb').addClass('xb-header-fixed');
                    } else {
                        $('.xb-header-area-sticky.xb-sticky-stb').removeClass('xb-header-fixed');
                    }

                    if (scrollDirection === 'up' && lastScrollPosition > 100) {
                        $('.xb-header-area-sticky.xb-sticky-stt').addClass('xb-header-fixed');
                    } else {
                        $('.xb-header-area-sticky.xb-sticky-stt').removeClass('xb-header-fixed');
                    }
                }
            });
        }

        // === Header Search ===
        $('.header-search-btn').on('click', function (e) {
            e.preventDefault();
            $('.header-search-form-wrapper').addClass('open');
            $('.header-search-form-wrapper input[type="search"]').focus();
            $('.body-overlay').addClass('active');
        });
        $('.xb-search-close').on('click', function (e) {
            e.preventDefault();
            $('.header-search-form-wrapper').removeClass('open');
            $('.body-overlay').removeClass('active');
        });

        // === Sidebar ===
        $('.sidebar-menu-close, .body-overlay').on('click', function () {
            $('.offcanvas-sidebar').removeClass('active');
            $('.body-overlay').removeClass('active');
        });

        $('.offcanvas-sidebar-btn').on('click', function () {
            $('.offcanvas-sidebar').addClass('active');
            $('.body-overlay').addClass('active');
        });

        $('.body-overlay').on('click', function () {
            $(this).removeClass('active');
            $('.header-search-form-wrapper').removeClass('open');
        });

        // === Mobile Menu ===
        $('.xb-nav-hidden li.menu-item-has-children > a').append('<span class="xb-menu-toggle"></span>');
        $('.xb-header-menu li.menu-item-has-children, .xb-menu-primary li.menu-item-has-children').append('<span class="xb-menu-toggle"></span>');

        $('.xb-menu-toggle').on('click', function () {
            if (!$(this).hasClass('active')) {
                $(this).closest('ul').find('.xb-menu-toggle.active').removeClass('active');
                $(this).closest('ul').find('.sub-menu.active').removeClass('active').slideUp();
            }
            $(this).toggleClass('active');
            $(this).closest('.menu-item').find('> .sub-menu').toggleClass('active').slideToggle();
        });

        $('.xb-nav-hidden li.menu-item-has-children > a').on('click', function (e) {
            const target = $(e.target);
            if ($(this).attr('href') === '#' && !target.is('.xb-menu-toggle')) {
                e.preventDefault();
                if (!$(this).find('.xb-menu-toggle').hasClass('active')) {
                    $(this).closest('ul').find('.xb-menu-toggle.active').removeClass('active');
                    $(this).closest('ul').find('.sub-menu.active').removeClass('active').slideUp();
                }
                $(this).find('.xb-menu-toggle').toggleClass('active');
                $(this).closest('.menu-item').find('> .sub-menu').toggleClass('active').slideToggle();
            }
        });

        $('.xb-nav-mobile').on('click', function () {
            $(this).toggleClass('active');
            $('.xb-header-menu').toggleClass('active');
        });

        $('.xb-menu-close, .xb-header-menu-backdrop').on('click', function () {
            $('.xb-header-menu').removeClass('active');
            $('.xb-nav-mobile').removeClass('active');
        });

        // Appel initial
        stickyHeader();

        // Nettoyage des événements à la destruction du composant
        return () => {
            $(window).off('scroll');
            $(
                '.header-search-btn, .xb-search-close, .sidebar-menu-close, .body-overlay, .offcanvas-sidebar-btn, .xb-menu-toggle, .xb-nav-hidden a, .xb-nav-mobile, .xb-menu-close, .xb-header-menu-backdrop',
            ).off();
        };
    }, []);

    return (
        <>
            <div>
                {/* header start */}
                <header id="xb-header-area" className="header-area is-sticky">
                    <div className="header-top_wrap">
                        <div className="container">
                            <div className="header-top ul_li_between">
                                <div className="xb-help_desk">
                                    <img src="/assets/img/icon/hero_top-icon.png" alt="" />
                                    <p>
                                        Help Desk : <span>+1&nbsp;(415)&nbsp;555‑0132</span>
                                    </p>
                                </div>
                                <div className="xb-info">
                                    <ul className="ul_li align-items-end">
                                        <li>Information For :</li>
                                        <li>
                                            <a href="#!">Students</a>
                                        </li>
                                        <li>
                                            <a href="#!">Faculty</a>
                                        </li>
                                        <li>
                                            <a href="#!">Alumni</a>
                                        </li>
                                        <li>
                                            <a href="#!">Research</a>
                                        </li>
                                        <li>
                                            <a href="#!">Community</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="xb-header">
                        <div className="container">
                            <div className="header__wrap ul_li_between">
                                <div className="header-logo">
                                    <a href="index.html">
                                        <img src="/assets/img/logo/logo.png" alt="" />
                                    </a>
                                </div>
                                <div className="main-menu__wrap ul_li navbar navbar-expand-lg">
                                    <nav className="main-menu navbar-collapse collapse">
                                        <ul>
                                            <li className="menu-item-has-children active">
                                                <a href="index.html">Accueil</a>
                                            </li>
                                            <li>
                                                <a href="admission.html">Admission</a>
                                            </li>
                                            <li className="menu-item-has-children">
                                                <a href="#!">Cours</a>
                                            </li>
                                            <li>
                                                <a href="contact.html">Contact</a>
                                            </li>
                                        </ul>
                                    </nav>
                                    <div className="xb-header-wrap">
                                        <div className="xb-header-menu">
                                            <div className="xb-header-menu-scroll">
                                                <div className="xb-menu-close xb-hide-xl xb-close" />
                                                <div className="xb-logo-mobile xb-hide-xl">
                                                    <a href="index.html" rel="home">
                                                        <img src="/assets/img/logo/logo.png" alt="" />
                                                    </a>
                                                </div>
                                                <div className="xb-header-mobile-search xb-hide-xl">
                                                    <form role="search" action="#">
                                                        <input type="text" placeholder="Search..." name="s" className="search-field" />
                                                        <button className="search-submit" type="submit">
                                                            <i className="far fa-search" />
                                                        </button>
                                                    </form>
                                                </div>
                                                <nav className="xb-header-nav">
                                                    <ul className="xb-menu-primary clearfix">
                                                        <li className="menu-item">
                                                            <a href="index.html">Accueil</a>
                                                        </li>
                                                        <li className="menu-item">
                                                            <a href="admission.html">Admission</a>
                                                        </li>
                                                        <li className="menu-item">
                                                            <a href="#!">Cours</a>
                                                        </li>
                                                        <li className="menu-item">
                                                            <a href="contact.html">Contact</a>
                                                        </li>
                                                    </ul>
                                                </nav>
                                            </div>
                                        </div>
                                        <div className="xb-header-menu-backdrop" />
                                    </div>
                                </div>
                                <div className="header-right ul_li">
                                    <a className="header-search header-search-btn" href="javascript:void(0);">
                                        <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10.5 3.75H15" stroke="#170006" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M10.5 6H12.75" stroke="#170006" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path
                                                d="M15.75 8.625C15.75 12.5625 12.5625 15.75 8.625 15.75C4.6875 15.75 1.5 12.5625 1.5 8.625C1.5 4.6875 4.6875 1.5 8.625 1.5"
                                                stroke="#170006"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                d="M16.5 16.5L15 15"
                                                stroke="#170006"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        Search
                                    </a>
                                    <div className="language_dropdown dropdown">
                                        <button
                                            className="dropdown-toggle"
                                            type="button"
                                            data-toggle="dropdown"
                                            aria-haspopup="true"
                                            aria-expanded="false"
                                        >
                                            <span className="flag">
                                                <img src="/assets/img/icon/flag.png" alt="USA" />
                                            </span>
                                            <span className="name">English</span>
                                        </button>
                                        <div className="dropdown-menu">
                                            <ul className="unordered_list_block">
                                                <li className="dropdown-item">
                                                    <span className="flag">
                                                        <img src="assets/img/icon/flag_saudi_arabia.webp" alt="Saudi Arabia" />
                                                    </span>
                                                    <span className="name">Arabic</span>
                                                </li>
                                                <li className="dropdown-item">
                                                    <span className="flag">
                                                        <img src="assets/img/icon/flag_bangladesh.webp" alt="Bangladesh" />
                                                    </span>
                                                    <span className="name">Bangali</span>
                                                </li>
                                                <li className="dropdown-item">
                                                    <span className="flag">
                                                        <img src="assets/img/icon/flag_usa.webp" alt="USA" />
                                                    </span>
                                                    <span className="name">English</span>
                                                </li>
                                                <li className="dropdown-item">
                                                    <span className="flag">
                                                        <img src="assets/img/icon/flag_portugal.webp" alt="Portugal" />
                                                    </span>
                                                    <span className="name">Portuguese</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="header-bar-mobile side-menu d-lg-none">
                                    <a className="xb-nav-mobile" href="javascript:void(0);">
                                        <FontAwesomeIcon icon="bars" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                {/* header end */}
                {/* header search start */}
                <div className="header-search-form-wrapper">
                    <div className="xb-search-close xb-close" />
                    <div className="header-search-container">
                        <form role="search" className="search-form" action="#">
                            <input type="search" className="search-field" placeholder="Search …" defaultValue="" name="s" />
                            <button type="submit" className="search-submit">
                                <i className="far fa-search" />
                            </button>
                        </form>
                    </div>
                </div>
                <div className="body-overlay" />
                {/* header search end */}
            </div>
        </>
    );
}
