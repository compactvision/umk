
export default function Breadcumb({ title, desc }: { title: string; desc: string }) {

    return (
        <section
            className="breadcrumb bg_img ul_li"
            data-background="/assets/img/bg/hero.jpg"
        >
            <div className="container">
                <div className="breadcrumb__content text-center">
                    <h2 className="breadcrumb__title">{title}</h2>
                    <p className="breadcrumb__desc">{desc}</p>
                </div>
            </div>
        </section>
    );
}
