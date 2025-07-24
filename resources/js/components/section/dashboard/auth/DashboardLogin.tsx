import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Alert from '@/utils/sweetAlert';

const DashboardLogin = () => {
    const { data, setData, post, processing, errors: formErrors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        Alert.loading('Connexion en cours...');

        post(route('login.store'), {
            onSuccess: () => {
                Alert.success('Connexion réussie !');
            },
            onError: () => {
                Alert.error('Une erreur est survenue lors de la connexion.');
            },
        });

    };

    const handleSocialLogin = (provider: string) => {
        console.log(`Connexion avec ${provider}`);
    };

    useEffect(() => {
        const logo = document.querySelector('.login-page__logo');
        if (logo) {
            const interval = setInterval(() => {
                logo.classList.add('login-page__logo--pulse');
                setTimeout(() => {
                    logo.classList.remove('login-page__logo--pulse');
                }, 200);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, []);

    const getButtonText = () => {
        switch (processing) {
            case true:
                return (
                    <>
                        <span className="login-form__submit-spinner">⟳</span>
                        Connexion en cours...
                    </>
                );
            default:
                return 'Se connecter';
        }
    };

    const getButtonClass = () => {
        let baseClass = 'login-form__submit';
        if (processing) baseClass += ' login-form__submit--loading';
        return baseClass;
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-form__group">
                        <input
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            className={`login-form__input ${focusedField === 'email' ? 'login-form__input--focused' : ''}`}
                            placeholder="Adresse email"
                            required
                        />
                        <div className="login-form__input-icon">
                          <svg style={{marginTop: '10px'}} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 128 128"><path fill="#fff" d="M117.64 102.31H10.36c-2.74 0-3.83-1.71-3.83-3.83V29.52c0-2.12 1.71-3.83 3.83-3.83h107.27c2.12 0 3.83 1.71 3.83 3.83v68.96a3.815 3.815 0 0 1-3.82 3.83"/><path fill="#6fbff0" stroke="#6fbff0" strokeMiterlimit="10" strokeWidth="0.5" d="M120.94 28.12a1.44 1.44 0 0 0-2.02-.19L82.23 58.81v6.35L86 61.73l32.25 38.73c.67.65 1.24.9 1.83.47c.37-.27.29-.78-.25-1.37l-29.57-41.7l30.5-27.72c.6-.5.69-1.41.18-2.02zm-73.9 31.75L9.08 27.93a1.43 1.43 0 0 0-2.02.19c-.51.61-.42 1.52.19 2.02l30.5 27.72L8.17 99.57c-.53.59-.61 1.1-.25 1.37c.59.43 1.16.18 1.83-.47L42 61.73l5.04 4.58z"/><path fill="none" stroke="#6fbff0" stroke-miterlimit="10" stroke-width="4" d="M117.64 102.31H10.36c-2.74 0-3.83-1.71-3.83-3.83V29.52c0-2.12 1.71-3.83 3.83-3.83h107.27c2.12 0 3.83 1.71 3.83 3.83v68.96a3.815 3.815 0 0 1-3.82 3.83z"/><path fill="#0d47a1" d="m51.52 41.96l25.5-2.29h1.42c.29 0 .57.13.75.36l1.45 1.85a.4.4 0 0 1 .08.23v7.82c0 .21-.17.38-.38.38h-20a.38.38 0 0 0-.38.38v9.99c0 .23.2.4.43.37l15.24-2.25h.67c.32 0 .62.15.81.39l1.43 1.82a.4.4 0 0 1 .08.23v7.82c0 .21-.17.38-.38.38H60.35a.38.38 0 0 0-.38.38v9.98c0 .23.21.41.44.37l13.13-2.24c.02 0 .04-.01.06-.01h4.8c.32 0 .62.15.82.4l1.42 1.82a.4.4 0 0 1 .08.23v7.82c0 .21-.17.38-.38.38H51.38a.39.39 0 0 1-.3-.14l-1.62-2.07a.44.44 0 0 1-.08-.25l1.8-43.78c.01-.2.16-.36.34-.37"/><path fill="#2196f3" d="M50.04 39.67h28.21c.37 0 .66.3.66.66v7c0 .37-.3.66-.66.66H58.82c-.37 0-.66.3-.66.66v9.47c0 .37.3.66.66.66h17.34c.37 0 .66.3.66.66v7c0 .37-.3.66-.66.66H58.82c-.37 0-.66.3-.66.66v9.47c0 .37.3.66.66.66h19.43c.37 0 .66.3.66.66v7c0 .37-.3.66-.66.66H50.04a.66.66 0 0 1-.66-.66V40.33c0-.37.3-.66.66-.66"/></svg>
                        </div>
                    </div>
                    {formErrors.email && <p className="login-form__error">{formErrors.email}</p>}

                    <div className="login-form__group">
                        <input
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            className={`login-form__input ${focusedField === 'password' ? 'login-form__input--focused' : ''}`}
                            placeholder="Mot de passe"
                            required
                        />
                        <div className="login-form__input-icon">
                          <svg style={{marginTop: '10px'}} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512"><path fill="#b1b4b5" d="M376.749 349.097c-13.531 0-24.5-10.969-24.5-24.5V181.932c0-48.083-39.119-87.203-87.203-87.203c-48.083 0-87.203 39.119-87.203 87.203v82.977c0 13.531-10.969 24.5-24.5 24.5s-24.5-10.969-24.5-24.5v-82.977c0-75.103 61.1-136.203 136.203-136.203s136.203 61.1 136.203 136.203v142.665c0 13.531-10.969 24.5-24.5 24.5"/><path fill="#ffb636" d="M414.115 497.459H115.977c-27.835 0-50.4-22.565-50.4-50.4V274.691c0-27.835 22.565-50.4 50.4-50.4h298.138c27.835 0 50.4 22.565 50.4 50.4v172.367c0 27.836-22.565 50.401-50.4 50.401"/><path fill="#ffd469" d="M109.311 456.841h-2.525c-7.953 0-14.4-6.447-14.4-14.4V279.309c0-7.953 6.447-14.4 14.4-14.4h2.525c7.953 0 14.4 6.447 14.4 14.4v163.132c0 7.953-6.447 14.4-14.4 14.4"/></svg>
                        </div>
                    </div>
                    {formErrors.password && <p className="login-form__error">{formErrors.password}</p>}

                    <div className="login-form__actions">
                        <label className="login-form__remember">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={handleInputChange}
                                className="login-form__checkbox"
                            />
                            <span className="login-form__checkbox-custom"></span>
                            Se souvenir de moi
                        </label>
                        <a href="#" className="login-form__forgot">
                            Mot de passe oublié ?
                        </a>
                    </div>

                    <button type="submit" className={getButtonClass()} disabled={processing}>
                        {getButtonText()}
                    </button>
                </form>

                <div className="login-divider">
                    <div className="login-divider__line"></div>
                    <span className="login-divider__text">ou connectez-vous avec</span>
                </div>

                <div className="social-login">
                    <button className="social-login__button social-login__button--google" onClick={() => handleSocialLogin('Google')}>
                        <span className="social-login__icon">G</span>
                        Google
                    </button>
                    <button className="social-login__button social-login__button--facebook" onClick={() => handleSocialLogin('Facebook')}>
                        <span className="social-login__icon">f</span>
                        Facebook
                    </button>
                    <button className="social-login__button social-login__button--twitter" onClick={() => handleSocialLogin('Twitter')}>
                        <span className="social-login__icon">𝕏</span>
                        Twitter
                    </button>
                </div>

                <div className="login-signup">
                    Pas encore de compte ?{' '}
                    <Link href={route('register')} className="login-signup__link">
                        Créer un compte
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardLogin;
