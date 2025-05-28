export default function Blog() {
    return (
        <section className="blog bg_img pt-115 pb-120" data-background="assets/img/bg/news_bg01.jpg">
            <div className="container">
                <div className="blog-sec-top ul_li_between">
                    <div className="section-title mb-40">
                        <span className="sub-title">Latest News</span>
                        <h1 className="title">Campus News</h1>
                    </div>
                    <div className="xb-topic">
                        <select name="Topic" id="seelct">
                            <option value={1}>Topic</option>
                            <option value={2}>Arts, Humanities, &amp; Social Sciences</option>
                            <option value={3}>Campus &amp; Community</option>
                            <option value={4}>Education, Business, &amp; Law</option>
                            <option value={5}>Health Sciences</option>
                            <option value={5}>Science &amp; Technology</option>
                        </select>
                    </div>
                </div>
                <div className="row justify-content-center">
                    <div className="col-lg-3 col-md-8">
                        <div className="xb-blog__left">
                            <div className="xb-blog pos-rel mt-20">
                                <div className="xb-item--img">
                                    <a href="#!">
                                        <img src="assets/img/blog/blog-img01.png" alt="" />
                                    </a>
                                </div>
                                <div className="xb-item--holder">
                                    <a className="xb-item--cta" href="#!">
                                        #Study
                                    </a>
                                    <h2 className="xb-item--title border-effect-2">
                                        {' '}
                                        <a href="blog-single.html">EduFord University Hosts International on Climate..</a>
                                    </h2>
                                </div>
                            </div>
                            <div className="xb-blog pos-rel mt-20">
                                <div className="xb-item--img">
                                    <a href="#!">
                                        <img src="assets/img/blog/blog-img02.png" alt="" />
                                    </a>
                                </div>
                                <div className="xb-item--holder">
                                    <a className="xb-item--cta" href="#!">
                                        #Membership
                                    </a>
                                    <h2 className="xb-item--title border-effect-2">
                                        {' '}
                                        <a href="blog-single.html">Thirty-one UChicago faculty members receive named..</a>
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-8">
                        <div className="xb-blog chn-margin pos-rel mt-20">
                            <div className="xb-item--img">
                                <a href="#!">
                                    <img src="assets/img/blog/blog-img03.png" alt="" />
                                </a>
                            </div>
                            <div className="xb-item--holder">
                                <a className="xb-item--cta" href="#!">
                                    #Study programs
                                </a>
                                <h2 className="xb-item--title border-effect">
                                    {' '}
                                    <a href="blog-single.html">
                                        EduFord University Receives Grant for <br /> Advanced STEM Programs..
                                    </a>
                                </h2>
                                <div className="xb-item--meta ul_li">
                                    <span>
                                        <i className="far fa-user" />
                                        Louis Saville
                                    </span>
                                    <span>
                                        <i className="far fa-clock" />
                                        2023/10/15
                                    </span>
                                    <span>
                                        <i className="far fa-comment" />
                                        15
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-8">
                        <div className="xb-blog__right">
                            <div className="xb-blog mr-left pos-rel mt-20">
                                <div className="xb-item--img">
                                    <a href="#!">
                                        <img src="assets/img/blog/blog-img04.png" alt="" />
                                    </a>
                                </div>
                                <div className="xb-item--holder">
                                    <a className="xb-item--cta" href="#!">
                                        #Awarded
                                    </a>
                                    <h2 className="xb-item--title border-effect-2">
                                        {' '}
                                        <a href="blog-single.html">our Awarded National for Community Outreach..</a>
                                    </h2>
                                </div>
                            </div>
                            <div className="xb-blog mr-left pos-rel mt-20">
                                <div className="xb-item--img">
                                    <a href="#!">
                                        <img src="assets/img/blog/blog-img05.png" alt="" />
                                    </a>
                                </div>
                                <div className="xb-item--holder">
                                    <a className="xb-item--cta" href="#!">
                                        #Campus Life
                                    </a>
                                    <h2 className="xb-item--title border-effect-2">
                                        {' '}
                                        <a href="blog-single.html">
                                            Expands Campus Facilities <br /> with State of-the-Art Lab..
                                        </a>
                                    </h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="xb-btn pt-60 text-center">
                    <a className="thm-btn" href="blog.html">
                        More Campus News
                        <span className="icon">
                            <svg width={21} height={21} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M10.4795 21C9.10959 21 7.81507 20.7539 6.59589 20.2617C5.37671 19.7695 4.30137 19.0962 3.36986 18.2417C2.43836 17.3872 1.67808 16.3857 1.08904 15.2373C0.486301 14.0752 0.123288 12.8311 0 11.5049V11.4639H8.56849V14.3145C8.56849 14.5742 8.66096 14.7998 8.84589 14.9912C9.03082 15.1826 9.25342 15.2783 9.5137 15.2783C9.65068 15.2783 9.7774 15.251 9.89384 15.1963C10.0103 15.1416 10.1096 15.0732 10.1918 14.9912L14.0137 11.1768C14.0959 11.0947 14.1644 10.9956 14.2192 10.8794C14.274 10.7632 14.3014 10.6367 14.3014 10.5C14.3014 10.3633 14.274 10.2368 14.2192 10.1206C14.1644 10.0044 14.0959 9.90527 14.0137 9.82324L10.1918 6.00879C10.1096 5.92676 10.0103 5.8584 9.89384 5.80371C9.7774 5.74902 9.65068 5.72168 9.5137 5.72168C9.25342 5.72168 9.0274 5.81738 8.83562 6.00879C8.64384 6.2002 8.54794 6.42578 8.54794 6.68555V9.53613H0C0.123288 8.19629 0.486301 6.94531 1.08904 5.7832C1.67808 4.62109 2.44178 3.61279 3.38014 2.7583C4.31849 1.90381 5.39041 1.23047 6.59589 0.738281C7.81507 0.246094 9.10959 0 10.4795 0C11.9315 0 13.2945 0.273439 14.5685 0.820312C15.8425 1.38086 16.9555 2.13623 17.9075 3.08643C18.8596 4.03662 19.6096 5.14746 20.1575 6.41895C20.7192 7.69043 21 9.05078 21 10.5C21 11.9492 20.7192 13.3096 20.1575 14.5811C19.6096 15.8662 18.8596 16.9839 17.9075 17.9341C16.9555 18.8843 15.8425 19.6328 14.5685 20.1797C13.2945 20.7266 11.9315 21 10.4795 21Z"
                                    fill="#170006"
                                />
                            </svg>
                        </span>
                    </a>
                </div>
            </div>
        </section>
    );
}
