import{m as k,r as i,j as e}from"./app-DMwhULoG.js";import{D as N}from"./Dashboard-QU51ji3H.js";import{A as h}from"./sweetAlert-BfUsjs3x.js";function F({token:x,email:f}){const{data:r,setData:n,post:g,processing:l,errors:a}=k({token:x,email:f||"",password:"",password_confirmation:""}),m=t=>{t.preventDefault(),r.email,r.password,r.password,r.password_confirmation,g(route("password.update"),{onSuccess:()=>{h.success("Mot de passe réinitialisé avec succès!")},onError:()=>{h.error("Une erreur est survenue lors de la réinitialisation de votre mot de passe.")}})},[z,s]=i.useState(null),[d,b]=i.useState(0),[p,w]=i.useState(!1),[c,v]=i.useState(!1),j=t=>{let o=0;return t.length>=8&&(o+=1),/[a-z]/.test(t)&&(o+=1),/[A-Z]/.test(t)&&(o+=1),/[0-9]/.test(t)&&(o+=1),/[^A-Za-z0-9]/.test(t)&&(o+=1),o};i.useEffect(()=>{b(j(r.password))},[r.password]);const u=()=>{switch(d){case 0:case 1:return"#ef4444";case 2:return"#f97316";case 3:return"#eab308";case 4:return"#22c55e";case 5:return"#10b981";default:return"#e5e7eb"}},y=()=>{switch(d){case 0:case 1:return"Très faible";case 2:return"Faible";case 3:return"Moyen";case 4:return"Fort";case 5:return"Très fort";default:return""}};return e.jsx(N,{children:e.jsxs("div",{className:"reset-password",children:[e.jsx("style",{jsx:!0,children:`
                    

                    .reset-password {
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        position: relative;
                        overflow: hidden;
                    }

                    .reset-password::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        animation: backgroundShift 12s ease-in-out infinite;
                    }

                    @keyframes backgroundShift {
                        0%, 100% { transform: scale(1) rotate(0deg); }
                        33% { transform: scale(1.1) rotate(120deg); }
                        66% { transform: scale(0.9) rotate(240deg); }
                    }

                    .auth-container {
                        background: rgba(255, 255, 255, 0.98);
                        backdrop-filter: blur(24px);
                        border-radius: 28px;
                        padding: 48px;
                        width: 100%;
                        max-width: 480px;
                        box-shadow: 
                            0 32px 64px -12px rgba(0, 0, 0, 0.4),
                            0 0 0 1px rgba(255, 255, 255, 0.1),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2);
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        position: relative;
                        z-index: 10;
                        animation: containerEntry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }

                    @keyframes containerEntry {
                        from {
                            opacity: 0;
                            transform: translateY(40px) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }

                    .auth-header {
                        text-align: center;
                        margin-bottom: 40px;
                    }

                    .auth-icon {
                        width: 72px;
                        height: 72px;
                        margin: 0 auto 24px;
                        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
                        border-radius: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 
                            0 12px 32px rgba(59, 130, 246, 0.4),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2);
                        animation: iconPulse 4s ease-in-out infinite;
                        position: relative;
                        overflow: hidden;
                    }

                    .auth-icon::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                        animation: iconShine 3s linear infinite;
                    }

                    .auth-icon::after {
                        content: '🔐';
                        font-size: 32px;
                        position: relative;
                        z-index: 1;
                        filter: brightness(1.3);
                    }

                    @keyframes iconPulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }

                    @keyframes iconShine {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    .auth-title {
                        color: #0f172a;
                        font-size: 32px;
                        font-weight: 800;
                        margin-bottom: 12px;
                        letter-spacing: -0.025em;
                        line-height: 1.1;
                        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }

                    .auth-subtitle {
                        color: #64748b;
                        font-size: 16px;
                        line-height: 1.6;
                        font-weight: 400;
                    }

                    .auth-form {
                        display: flex;
                        flex-direction: column;
                        gap: 28px;
                    }

                    .input-group {
                        position: relative;
                    }

                    .input-wrapper {
                        position: relative;
                        display: flex;
                        align-items: center;
                    }

                    .auth-input {
                        width: 100%;
                        height: 60px;
                        padding: 0 24px 0 60px;
                        border: 2px solid #e2e8f0;
                        border-radius: 18px;
                        font-size: 16px;
                        background: #fafbfc;
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        outline: none;
                        color: #0f172a;
                        font-weight: 500;
                        position: relative;
                    }

                    .auth-input:focus {
                        border-color: #3b82f6;
                        background: white;
                        box-shadow: 
                            0 0 0 4px rgba(59, 130, 246, 0.08),
                            0 12px 32px rgba(59, 130, 246, 0.12);
                        transform: translateY(-3px);
                    }

                    .auth-input::placeholder {
                        color: #94a3b8;
                        font-weight: 400;
                    }

                    .input-icon {
                        position: absolute;
                        left: 22px;
                        font-size: 20px;
                        color: #94a3b8;
                        transition: all 0.3s ease;
                        z-index: 1;
                    }

                    .auth-input:focus ~ .input-icon {
                        color: #3b82f6;
                        transform: scale(1.1);
                    }

                    .password-toggle {
                        position: absolute;
                        right: 20px;
                        background: none;
                        border: none;
                        font-size: 18px;
                        color: #94a3b8;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        z-index: 2;
                        padding: 4px;
                        border-radius: 8px;
                    }

                    .password-toggle:hover {
                        color: #3b82f6;
                        background: rgba(59, 130, 246, 0.08);
                    }

                    .password-strength {
                        margin-top: 12px;
                        display: flex;
                        gap: 4px;
                        align-items: center;
                    }

                    .strength-bar {
                        height: 4px;
                        flex: 1;
                        background: #e5e7eb;
                        border-radius: 2px;
                        transition: all 0.3s ease;
                    }

                    .strength-bar.active {
                        background: ${u()};
                    }

                    .strength-text {
                        font-size: 12px;
                        font-weight: 600;
                        color: ${u()};
                        margin-left: 8px;
                        min-width: 70px;
                    }

                    .input-error {
                        color: #ef4444;
                        font-size: 14px;
                        font-weight: 500;
                        margin-top: 10px;
                        animation: errorBounce 0.6s ease-out;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: rgba(239, 68, 68, 0.05);
                        padding: 8px 12px;
                        border-radius: 8px;
                        border-left: 3px solid #ef4444;
                    }

                    .input-error::before {
                        content: '❌';
                        font-size: 12px;
                    }

                    @keyframes errorBounce {
                        0%, 20%, 40%, 60%, 80% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                    }

                    .auth-button {
                        height: 60px;
                        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
                        color: white;
                        border: none;
                        border-radius: 18px;
                        font-size: 17px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
                        position: relative;
                        overflow: hidden;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                        font-size: 14px;
                    }

                    .auth-button:hover:not(:disabled) {
                        transform: translateY(-3px);
                        box-shadow: 0 16px 40px rgba(59, 130, 246, 0.5);
                        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #0891b2 100%);
                    }

                    .auth-button:active:not(:disabled) {
                        transform: translateY(-1px);
                    }

                    .auth-button:disabled {
                        opacity: 0.6;
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
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                        transition: left 0.6s;
                    }

                    .auth-button:hover:not(:disabled)::before {
                        left: 100%;
                    }

                    .loading-spinner {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-radius: 50%;
                        border-top-color: white;
                        animation: spin 1s linear infinite;
                        margin-right: 10px;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    .security-info {
                        margin-top: 32px;
                        padding: 20px;
                        background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
                        border-radius: 16px;
                        border: 1px solid rgba(34, 197, 94, 0.1);
                        font-size: 13px;
                        color: #059669;
                        text-align: center;
                        line-height: 1.5;
                    }

                    .security-info::before {
                        content: '🔒';
                        display: block;
                        font-size: 20px;
                        margin-bottom: 8px;
                    }

                    @media (max-width: 520px) {
                        .auth-container {
                            padding: 32px 24px;
                            margin: 0 16px;
                            border-radius: 24px;
                        }
                        
                        .auth-title {
                            font-size: 26px;
                        }
                        
                        .auth-subtitle {
                            font-size: 15px;
                        }
                        
                        .auth-input,
                        .auth-button {
                            height: 56px;
                        }
                        
                        .auth-form {
                            gap: 24px;
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
                `}),e.jsxs("div",{className:"auth-container",children:[e.jsxs("div",{className:"auth-header",children:[e.jsx("div",{className:"auth-icon"}),e.jsx("h1",{className:"auth-title",children:"Nouveau mot de passe"}),e.jsx("p",{className:"auth-subtitle",children:"Créez un mot de passe sécurisé pour protéger votre compte"})]}),e.jsxs("div",{className:"auth-form",children:[e.jsxs("div",{className:"input-group",children:[e.jsxs("div",{className:"input-wrapper",children:[e.jsx("input",{type:"email",name:"email",value:r.email,onChange:t=>n({...r,email:t.target.value}),className:"auth-input",placeholder:"votre.email@exemple.com",required:!0,onFocus:()=>s("email"),onBlur:()=>s(null),readOnly:!0}),e.jsx("div",{className:"input-icon",children:"📧"})]}),a.email&&e.jsx("div",{className:"input-error",children:a.email})]}),e.jsxs("div",{className:"input-group",children:[e.jsxs("div",{className:"input-wrapper",children:[e.jsx("input",{type:p?"text":"password",name:"password",value:r.password,onChange:t=>n({...r,password:t.target.value}),className:"auth-input",placeholder:"Nouveau mot de passe",required:!0,onFocus:()=>s("password"),onBlur:()=>s(null)}),e.jsx("div",{className:"input-icon",children:"🔑"}),e.jsx("button",{type:"button",className:"password-toggle",onClick:()=>w(!p),children:p?"🙈":"👁️"})]}),r.password&&e.jsxs("div",{className:"password-strength",children:[[1,2,3,4,5].map(t=>e.jsx("div",{className:`strength-bar ${t<=d?"active":""}`},t)),e.jsx("div",{className:"strength-text",children:y()})]}),a.password&&e.jsx("div",{className:"input-error",children:a.password})]}),e.jsxs("div",{className:"input-group",children:[e.jsxs("div",{className:"input-wrapper",children:[e.jsx("input",{type:c?"text":"password",name:"password_confirmation",value:r.password_confirmation,onChange:t=>n({...r,password_confirmation:t.target.value}),className:"auth-input",placeholder:"Confirmer le nouveau mot de passe",required:!0,onFocus:()=>s("confirm"),onBlur:()=>s(null)}),e.jsx("div",{className:"input-icon",children:"🔐"}),e.jsx("button",{type:"button",className:"password-toggle",onClick:()=>v(!c),children:c?"🙈":"👁️"})]}),a.password_confirmation&&e.jsx("div",{className:"input-error",children:a.password_confirmation})]}),e.jsxs("button",{type:"button",className:"auth-button",disabled:l,onClick:m,children:[l&&e.jsx("div",{className:"loading-spinner"}),l?"Réinitialisation...":"Réinitialiser le mot de passe"]})]}),e.jsx("div",{className:"security-info",children:"Votre mot de passe sera chiffré et stocké de manière sécurisée. Assurez-vous qu'il contient au moins 8 caractères avec des lettres, chiffres et symboles."})]})]})})}export{F as default};
