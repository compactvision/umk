export default function Fanfact() {
    return (
        <section className="funfact" data-bg-color="#F1F1E9">
            <div className="funfact-image">
                <img src="assets/img/bg/fanfact_bg.jpg" alt="Fond statistiques" />
            </div>
            <div className="container">
                <div className="funfact-inner ul_li_between">
                    <div className="funfact-item mt-30">
                        <h3 className="xb-item--title">
                            3.97<span>moyenne</span>
                        </h3>
                        <p className="xb-item--contact">
                            La promotion de première année d'EduFord <br /> 
                            affiche une moyenne record de 3.97.
                        </p>
                    </div>
                    <div className="funfact-item mt-30">
                        <h3 className="xb-item--title">
                            82%<span>aides</span>
                        </h3>
                        <p className="xb-item--contact">
                            82% de nos étudiants en licence <br /> 
                            bénéficient d'une aide financière.
                        </p>
                    </div>
                    <div className="funfact-item mt-30">
                        <h3 className="xb-item--title">
                            157<span>pays</span>
                        </h3>
                        <p className="xb-item--contact">
                            Représentation de 157 pays <br /> 
                            et de toutes les régions de France.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}