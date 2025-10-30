import{m as c,r as u,j as e}from"./app-DMwhULoG.js";import{D as h}from"./Dashboard-QU51ji3H.js";import{A as i}from"./sweetAlert-BfUsjs3x.js";function g({status:o}){const{data:s,setData:l,post:p,processing:t,errors:n}=c({email:""}),[x,r]=u.useState(!1),d=a=>{a.preventDefault(),i.loading("Envoi de l'email de réinitialisation en cours..."),p(route("password.email"),{onSuccess:()=>{i.success("Un email de réinitialisation de mot de passe a été envoyé à votre adresse email.")},onError:()=>{i.error("Une erreur est survenue lors de la réinitialisation de votre mot de passe.")}})};return e.jsx(h,{children:e.jsxs("div",{className:"forgot-password",children:[e.jsx("style",{children:`
                    .forgot-password {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        position: relative;
                        overflow: hidden;
                    }

                    .forgot-password::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        animation: backgroundPulse 8s ease-in-out infinite;
                    }

                    @keyframes backgroundPulse {
                        0%, 100% { opacity: 0.8; }
                        50% { opacity: 1; }
                    }

                    .auth-container {
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(20px);
                        border-radius: 24px;
                        padding: 48px;
                        width: 100%;
                        max-width: 440px;
                        box-shadow: 
                            0 25px 50px -12px rgba(0, 0, 0, 0.25),
                            0 0 0 1px rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        position: relative;
                        z-index: 10;
                        animation: slideUp 0.6s ease-out;
                    }

                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .auth-icon {
                        width: 64px;
                        height: 64px;
                        margin: 0 auto 32px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                        animation: iconFloat 3s ease-in-out infinite;
                    }

                    @keyframes iconFloat {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-5px); }
                    }

                    .auth-icon::before {
                        content: '🔐';
                        font-size: 28px;
                        filter: brightness(1.2);
                    }

                    .auth-title {
                        color: #1a202c;
                        font-size: 28px;
                        font-weight: 700;
                        text-align: center;
                        margin-bottom: 12px;
                        letter-spacing: -0.025em;
                        line-height: 1.2;
                    }

                    .auth-subtitle {
                        color: #64748b;
                        font-size: 16px;
                        text-align: center;
                        line-height: 1.6;
                        margin-bottom: 40px;
                        font-weight: 400;
                    }

                    .status-alert {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        padding: 16px 20px;
                        border-radius: 12px;
                        margin-bottom: 24px;
                        font-size: 14px;
                        font-weight: 500;
                        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
                        animation: alertSlide 0.4s ease-out;
                        position: relative;
                        overflow: hidden;
                    }

                    .status-alert::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                        animation: shimmer 2s infinite;
                    }

                    @keyframes shimmer {
                        0% { left: -100%; }
                        100% { left: 100%; }
                    }

                    @keyframes alertSlide {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .auth-form {
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                    }

                    .input-wrapper {
                        position: relative;
                    }

                    .auth-input {
                        width: 100%;
                        height: 56px;
                        padding: 0 20px 0 56px;
                        border: 2px solid #e2e8f0;
                        border-radius: 16px;
                        font-size: 16px;
                        background: #fafafa;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        outline: none;
                        color: #1a202c;
                        font-weight: 500;
                    }

                    .auth-input:focus {
                        border-color: #667eea;
                        background: white;
                        box-shadow: 
                            0 0 0 3px rgba(102, 126, 234, 0.1),
                            0 8px 25px rgba(0, 0, 0, 0.08);
                        transform: translateY(-2px);
                    }

                    .auth-input::placeholder {
                        color: #94a3b8;
                        font-weight: 400;
                    }

                    .input-icon {
                        position: absolute;
                        left: 20px;
                        top: 50%;
                        transform: translateY(-50%);
                        font-size: 20px;
                        color: #94a3b8;
                        transition: color 0.3s ease;
                        z-index: 1;
                    }

                    .auth-input:focus + .input-icon {
                        color: #667eea;
                    }

                    .input-error {
                        color: #ef4444;
                        font-size: 14px;
                        font-weight: 500;
                        margin-top: 8px;
                        animation: errorShake 0.5s ease-out;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .input-error::before {
                        content: '⚠️';
                        font-size: 12px;
                    }

                    @keyframes errorShake {
                        0%, 20%, 40%, 60%, 80% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    }

                    .auth-button {
                        height: 56px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 16px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                        position: relative;
                        overflow: hidden;
                        letter-spacing: 0.025em;
                    }

                    .auth-button:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
                    }

                    .auth-button:active:not(:disabled) {
                        transform: translateY(0);
                    }

                    .auth-button:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                        transform: none;
                    }

                    .auth-button::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                        transition: left 0.5s;
                    }

                    .auth-button:hover:not(:disabled)::before {
                        left: 100%;
                    }

                    .loading-spinner {
                        display: inline-block;
                        width: 18px;
                        height: 18px;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-radius: 50%;
                        border-top-color: white;
                        animation: spin 1s ease-in-out infinite;
                        margin-right: 8px;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    .back-link {
                        text-align: center;
                        margin-top: 32px;
                    }

                    .back-link a {
                        color: #667eea;
                        text-decoration: none;
                        font-weight: 500;
                        font-size: 14px;
                        transition: color 0.3s ease;
                        position: relative;
                    }

                    .back-link a:hover {
                        color: #764ba2;
                    }

                    .back-link a::after {
                        content: '';
                        position: absolute;
                        bottom: -2px;
                        left: 0;
                        width: 0;
                        height: 2px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        transition: width 0.3s ease;
                    }

                    .back-link a:hover::after {
                        width: 100%;
                    }

                    @media (max-width: 480px) {
                        .auth-container {
                            padding: 32px 24px;
                            margin: 0 16px;
                        }
                        
                        .auth-title {
                            font-size: 24px;
                        }
                        
                        .auth-subtitle {
                            font-size: 15px;
                        }
                        
                        .auth-input,
                        .auth-button {
                            height: 52px;
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        *,
                        *::before,
                        *::after {
                            animation-duration: 0.01ms !important;
                            animation-iteration-count: 1 !important;
                            transition-duration: 0.01ms !important;
                        }
                    }
                `}),e.jsxs("div",{className:"auth-container",children:[e.jsx("div",{className:"auth-icon"}),e.jsx("h1",{className:"auth-title",children:"Mot de passe oublié"}),e.jsx("p",{className:"auth-subtitle",children:"Saisissez votre adresse email et nous vous enverrons un lien de réinitialisation sécurisé."}),o&&e.jsx("div",{className:"status-alert",children:o}),e.jsxs("div",{className:"auth-form",children:[e.jsxs("div",{className:"input-wrapper",children:[e.jsx("input",{type:"email",name:"email",value:s.email,onChange:a=>l({email:a.target.value}),className:"auth-input",placeholder:"votre.email@exemple.com",required:!0,onFocus:()=>r(!0),onBlur:()=>r(!1)}),e.jsx("div",{className:"input-icon",children:"📧"}),n.email&&e.jsx("div",{className:"input-error",children:n.email})]}),e.jsxs("button",{type:"button",className:"auth-button",disabled:t,onClick:d,children:[t&&e.jsx("div",{className:"loading-spinner"}),t?"Envoi en cours...":"Envoyer le lien de réinitialisation"]})]}),e.jsx("div",{className:"back-link",children:e.jsx("a",{href:"/login",children:"← Retour à la connexion"})})]})]})})}export{g as default};
