import{m as n,j as e,$ as s}from"./app-BcX18DqI.js";import{D as l}from"./Dashboard-Cc4QyX7c.js";import"./sweetAlert-BfUsjs3x.js";function f({status:i}){const{post:o,processing:r}=n(),t=a=>{a.preventDefault(),o(route("verification.send"))};return e.jsxs(l,{children:[e.jsx("div",{className:"email-verify",children:e.jsxs("div",{className:"verify-container",children:[e.jsx("div",{className:"verify-icon",children:e.jsxs("svg",{viewBox:"0 0 64 64",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("circle",{cx:"32",cy:"32",r:"28",stroke:"currentColor",strokeWidth:"2",fill:"none",strokeDasharray:"4 4",className:"icon-circle"}),e.jsx("path",{d:"M32 12v8m0 24v8m12-20h-8m-24 0h8",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"}),e.jsx("circle",{cx:"32",cy:"32",r:"3",fill:"currentColor"})]})}),e.jsxs("div",{className:"verify-content",children:[e.jsx("h1",{className:"verify-title",children:"Vérifiez votre adresse email"}),e.jsx("p",{className:"verify-description",children:"Nous avons envoyé un lien de vérification à votre adresse email. Cliquez sur le lien pour activer votre compte et accéder à toutes les fonctionnalités."}),e.jsxs("div",{className:"verify-email-note",children:[e.jsx("svg",{className:"email-icon",viewBox:"0 0 24 24",fill:"none",children:e.jsx("path",{d:"M3 8L12 13L21 8M3 8V16C3 16.5523 3.44772 17 4 17H20C20.5523 17 21 16.5523 21 16V8M3 8C3 7.44772 3.44772 7 4 7H20C20.5523 7 21 7.44772 21 8",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})}),e.jsx("span",{children:"Vérifiez également votre dossier spam"})]}),i==="verification-link-sent"&&e.jsxs("div",{className:"verify-alert success-alert",children:[e.jsx("svg",{className:"alert-icon",viewBox:"0 0 20 20",fill:"currentColor",children:e.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",clipRule:"evenodd"})}),e.jsxs("div",{children:[e.jsx("strong",{children:"Email envoyé avec succès !"}),e.jsx("p",{children:"Un nouveau lien de vérification vient d'être envoyé à votre adresse email."})]})]}),e.jsx("form",{onSubmit:t,className:"verify-form",children:e.jsx("button",{type:"submit",className:`verify-button ${r?"loading":""}`,disabled:r,children:r?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"loading-spinner"}),e.jsx("span",{children:"Envoi en cours..."})]}):e.jsxs(e.Fragment,{children:[e.jsxs("svg",{className:"button-icon",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("path",{d:"M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z",stroke:"currentColor",strokeWidth:"2"}),e.jsx("path",{d:"M22 6L12 13L2 6",stroke:"currentColor",strokeWidth:"2"})]}),"Renvoyer l'email de vérification"]})})}),e.jsxs("div",{className:"verify-footer",children:[e.jsx("p",{className:"footer-text",children:"Vous n'avez pas reçu l'email ?"}),e.jsxs("div",{className:"footer-actions",children:[e.jsxs(s,{href:route("logout"),method:"post",as:"button",className:"logout-link",children:[e.jsxs("svg",{className:"logout-icon",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("path",{d:"M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"M16 17L21 12L16 7",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"M21 12H9",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})]}),"Se déconnecter"]}),e.jsxs("button",{type:"button",className:"support-link",children:[e.jsxs("svg",{className:"support-icon",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"2"}),e.jsx("path",{d:"M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"H12V16H12.01",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})]}),"Besoin d'aide ?"]})]})]})]})]})}),e.jsx("style",{children:`
                /* Variables CSS pour la cohérence */
                :root {
                    --primary-color: #3b82f6;
                    --primary-hover: #2563eb;
                    --primary-light: #dbeafe;
                    --success-color: #10b981;
                    --success-light: #d1fae5;
                    --text-primary: #111827;
                    --text-secondary: #6b7280;
                    --text-muted: #9ca3af;
                    --border-color: #e5e7eb;
                    --border-light: #f3f4f6;
                    --background: #ffffff;
                    --background-muted: #f9fafb;
                    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    --radius-sm: 0.375rem;
                    --radius-md: 0.5rem;
                    --radius-lg: 0.75rem;
                    --radius-xl: 1rem;
                    --spacing-xs: 0.5rem;
                    --spacing-sm: 0.75rem;
                    --spacing-md: 1rem;
                    --spacing-lg: 1.5rem;
                    --spacing-xl: 2rem;
                    --spacing-2xl: 3rem;
                    --font-sm: 0.875rem;
                    --font-base: 1rem;
                    --font-lg: 1.125rem;
                    --font-xl: 1.25rem;
                    --font-2xl: 1.5rem;
                    --font-3xl: 1.875rem;
                }

                /* Reset et base */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .email-verify {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f8fafc 0%, var(--background-muted) 100%);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: var(--spacing-md);
                    position: relative;
                    overflow-x: hidden;
                }

                /* Effet de fond subtil */
                .email-verify::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: 
                        radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
                    pointer-events: none;
                }

                .verify-container {
                    background: var(--background);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-xl);
                    border: 1px solid var(--border-light);
                    width: 100%;
                    max-width: 480px;
                    padding: var(--spacing-2xl);
                    position: relative;
                    backdrop-filter: blur(10px);
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

                /* Icône de vérification */
                .verify-icon {
                    display: flex;
                    justify-content: center;
                    margin-bottom: var(--spacing-xl);
                }

                .verify-icon svg {
                    width: 80px;
                    height: 80px;
                    color: var(--primary-color);
                }

                .icon-circle {
                    animation: rotate 8s linear infinite;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Contenu principal */
                .verify-content {
                    text-align: center;
                }

                .verify-title {
                    font-size: var(--font-3xl);
                    font-weight: 800;
                    color: var(--text-primary);
                    margin-bottom: var(--spacing-lg);
                    line-height: 1.2;
                    letter-spacing: -0.025em;
                }

                .verify-description {
                    font-size: var(--font-lg);
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: var(--spacing-xl);
                }

                .verify-email-note {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--spacing-sm);
                    background: var(--primary-light);
                    color: var(--primary-color);
                    padding: var(--spacing-sm) var(--spacing-md);
                    border-radius: var(--radius-lg);
                    font-size: var(--font-sm);
                    font-weight: 500;
                    margin-bottom: var(--spacing-xl);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }

                .email-icon {
                    width: 18px;
                    height: 18px;
                    flex-shrink: 0;
                }

                /* Alerte de succès */
                .verify-alert {
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-lg);
                    margin-bottom: var(--spacing-xl);
                    animation: fadeIn 0.5s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                .success-alert {
                    background: var(--success-light);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    display: flex;
                    align-items: flex-start;
                    gap: var(--spacing-sm);
                    text-align: left;
                }

                .alert-icon {
                    width: 20px;
                    height: 20px;
                    color: var(--success-color);
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .success-alert strong {
                    color: var(--success-color);
                    font-weight: 600;
                    display: block;
                    margin-bottom: 4px;
                }

                .success-alert p {
                    color: #047857;
                    font-size: var(--font-sm);
                    line-height: 1.5;
                }

                /* Formulaire */
                .verify-form {
                    margin-bottom: var(--spacing-xl);
                }

                .verify-button {
                    width: 100%;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-md) var(--spacing-lg);
                    font-size: var(--font-base);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--spacing-sm);
                    min-height: 48px;
                    position: relative;
                    overflow: hidden;
                }

                .verify-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s;
                }

                .verify-button:hover::before {
                    left: 100%;
                }

                .verify-button:hover:not(:disabled) {
                    background: var(--primary-hover);
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-lg);
                }

                .verify-button:active:not(:disabled) {
                    transform: translateY(0);
                    box-shadow: var(--shadow-md);
                }

                .verify-button:disabled {
                    background: var(--text-muted);
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .button-icon {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                }

                /* Animation de chargement */
                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Pied de page */
                .verify-footer {
                    border-top: 1px solid var(--border-light);
                    padding-top: var(--spacing-lg);
                }

                .footer-text {
                    color: var(--text-muted);
                    font-size: var(--font-sm);
                    margin-bottom: var(--spacing-md);
                }

                .footer-actions {
                    display: flex;
                    gap: var(--spacing-lg);
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .logout-link,
                .support-link {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    font-size: var(--font-sm);
                    color: var(--text-secondary);
                    text-decoration: none;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: var(--radius-sm);
                    transition: all 0.2s ease;
                    font-weight: 500;
                }

                .logout-link:hover,
                .support-link:hover {
                    color: var(--primary-color);
                    background: var(--primary-light);
                }

                .logout-icon,
                .support-icon {
                    width: 16px;
                    height: 16px;
                }

                /* Responsive Design */
                @media (max-width: 640px) {
                    .email-verify {
                        padding: var(--spacing-sm);
                    }

                    .verify-container {
                        padding: var(--spacing-xl);
                        max-width: 100%;
                    }

                    .verify-title {
                        font-size: var(--font-2xl);
                    }

                    .verify-description {
                        font-size: var(--font-base);
                    }

                    .verify-icon svg {
                        width: 64px;
                        height: 64px;
                    }

                    .footer-actions {
                        flex-direction: column;
                        gap: var(--spacing-sm);
                    }

                    .verify-email-note {
                        flex-direction: column;
                        text-align: center;
                        gap: var(--spacing-xs);
                    }

                    .success-alert {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                @media (max-width: 480px) {
                    .verify-container {
                        padding: var(--spacing-lg);
                        border-radius: var(--radius-lg);
                    }

                    .verify-title {
                        font-size: var(--font-xl);
                        margin-bottom: var(--spacing-md);
                    }

                    .verify-description {
                        font-size: var(--font-sm);
                        margin-bottom: var(--spacing-lg);
                    }

                    .verify-icon {
                        margin-bottom: var(--spacing-lg);
                    }

                    .verify-icon svg {
                        width: 56px;
                        height: 56px;
                    }

                    .verify-button {
                        padding: var(--spacing-sm) var(--spacing-md);
                        font-size: var(--font-sm);
                    }
                }

                /* Amélioration de l'accessibilité */
                @media (prefers-reduced-motion: reduce) {
                    .icon-circle,
                    .loading-spinner,
                    .verify-button::before {
                        animation: none;
                    }

                    .verify-container {
                        animation: none;
                    }
                }

                /* Focus states pour l'accessibilité */
                .verify-button:focus,
                .logout-link:focus,
                .support-link:focus {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }

                /* Amélioration du contraste */
                @media (prefers-contrast: high) {
                    .verify-container {
                        border-width: 2px;
                    }

                    .verify-button {
                        border: 2px solid transparent;
                    }

                    .verify-button:focus {
                        border-color: var(--primary-color);
                    }
                }
            `})]})}export{f as default};
