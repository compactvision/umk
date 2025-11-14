import{a as h,r as d,j as e,L as f}from"./app-CrEZxZPN.js";import{D as g}from"./Dashboard-MrfJn1Ae.js";import{A as i}from"./sweetAlert-020wAXQ5.js";import"./app-D82Eias8.js";import"./index-ahlpUeho.js";import"./book-open-CCnEYhtL.js";import"./createLucideIcon-Czo8_6x-.js";import"./calendar-BkWmeAUB.js";import"./graduation-cap-DvR2CiT5.js";import"./x-D9q6IKqI.js";import"./chevron-right-xoj_290k.js";import"./trending-up-H111W-6U.js";import"./users-D6ep99u-.js";import"./shield-DRjH6foE.js";import"./user-C-FLhoEw.js";import"./clock-BP-kfJlB.js";import"./award-BSlSJhLL.js";function E({status:n}){const{data:x,setData:c,post:p,processing:l,errors:a}=h({email:""}),[t,o]=d.useState(!1),[s,m]=d.useState(!1),u=r=>{r.preventDefault(),m(!0),i.loading("Envoi de l'email de réinitialisation en cours..."),p(route("password.email"),{onSuccess:()=>{i.success("Un email de réinitialisation de mot de passe a été envoyé à votre adresse email.")},onError:()=>{i.error("Une erreur est survenue lors de la réinitialisation de votre mot de passe."),m(!1)}})};return e.jsxs(g,{children:[e.jsxs("div",{className:"flex items-center justify-center p-4 sm:p-5 font-sans relative overflow-hidden",children:[e.jsxs("div",{className:"absolute inset-0",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"}),e.jsx("div",{className:"absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-gradient-shift"}),e.jsx("div",{className:"hidden sm:block absolute top-20 left-20 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-float-1"}),e.jsx("div",{className:"hidden sm:block absolute top-40 right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-xl animate-float-2"}),e.jsx("div",{className:"hidden sm:block absolute bottom-20 left-1/3 w-36 h-36 bg-indigo-400/20 rounded-full blur-xl animate-float-3"})]}),e.jsxs("div",{className:"bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 w-full max-w-sm sm:max-w-md shadow-2xl border border-white/20 relative z-10 animate-slide-up",children:[e.jsx("div",{className:"flex justify-center mb-4 sm:mb-6",children:e.jsxs("div",{className:"inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium",children:[e.jsx("span",{className:"w-2 h-2 bg-green-500 rounded-full animate-pulse"}),e.jsx("span",{className:"hidden sm:inline",children:"Connexion sécurisée"}),e.jsx("span",{className:"sm:hidden",children:"Sécurisé"})]})}),e.jsxs("div",{className:"w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg sm:shadow-xl shadow-indigo-500/30 animate-float relative overflow-hidden group",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-spin-slow"}),e.jsx("span",{className:"text-2xl sm:text-3xl relative z-10 group-hover:scale-110 transition-transform duration-300",children:"🔐"})]}),e.jsx("h1",{className:"text-2xl sm:text-3xl font-bold text-center mb-3 tracking-tight bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent",children:"Mot de passe oublié"}),e.jsx("p",{className:"text-gray-500 text-center text-sm sm:text-base leading-relaxed mb-8 sm:mb-10 px-2",children:"Pas de souci ! Saisissez votre adresse email et nous vous enverrons un lien de réinitialisation sécurisé."}),n&&e.jsxs("div",{className:"bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 sm:p-4 rounded-xl mb-6 text-xs sm:text-sm font-medium shadow-lg shadow-green-500/30 animate-alert-slide relative overflow-hidden",children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("svg",{className:"w-4 h-4 sm:w-5 sm:h-5",fill:"currentColor",viewBox:"0 0 20 20",children:e.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",clipRule:"evenodd"})}),e.jsx("span",{className:"text-xs sm:text-sm",children:n})]})]}),e.jsxs("div",{className:"space-y-4 sm:space-y-6",children:[e.jsxs("div",{className:"relative group",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Adresse email"}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:"email",name:"email",value:x.email,onChange:r=>c({email:r.target.value}),className:`w-full h-12 sm:h-14 px-4 sm:px-5 pl-12 sm:pl-14 border-2 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all duration-300 outline-none font-medium
                                        ${t?"border-indigo-500 bg-white shadow-lg shadow-indigo-500/10 -translate-y-0.5":"border-gray-200 bg-gray-50"} ${s&&!a.email?"border-green-500 bg-green-50":""}`,placeholder:"votre.email@exemple.com",required:!0,onFocus:()=>o(!0),onBlur:()=>o(!1)}),e.jsx("div",{className:`absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-lg sm:text-xl transition-all duration-300 z-10 ${t?"text-indigo-500 scale-110":"text-gray-400"} ${s&&!a.email?"text-green-500":""}`,children:s&&!a.email?"✅":"📧"}),t&&e.jsx("div",{className:"absolute -inset-1 bg-indigo-500/5 rounded-xl sm:rounded-2xl animate-pulse"})]}),a.email&&e.jsxs("div",{className:"mt-2 text-xs sm:text-sm text-red-500 font-medium flex items-center gap-2 animate-error-shake bg-red-50 p-2 rounded-lg border-l-3 border-red-500",children:[e.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4",fill:"currentColor",viewBox:"0 0 20 20",children:e.jsx("path",{fillRule:"evenodd",d:"M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z",clipRule:"evenodd"})}),e.jsx("span",{className:"text-xs",children:a.email})]})]}),e.jsxs("button",{type:"button",className:"w-full h-12 sm:h-14 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg shadow-indigo-500/30 relative overflow-hidden tracking-wide hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none group",disabled:l,onClick:u,children:[e.jsx("span",{className:"absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-500"}),e.jsx("span",{className:"relative z-10 flex items-center justify-center gap-2",children:l?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 rounded-full border-t-white animate-spin"}),e.jsx("span",{className:"text-xs sm:text-sm",children:"Envoi en cours..."})]}):e.jsxs(e.Fragment,{children:[e.jsx("svg",{className:"w-4 h-4 sm:w-5 sm:h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"})}),e.jsx("span",{className:"text-xs sm:text-sm",children:"Envoyer le lien"})]})})]})]}),e.jsxs("div",{className:"text-center mt-6 sm:mt-8",children:[e.jsxs("div",{className:"inline-flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4",children:[e.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})}),e.jsx("span",{className:"hidden sm:inline",children:"Besoin d'aide ?"}),e.jsx("span",{className:"sm:hidden",children:"Aide"})]}),e.jsxs(f,{href:"/login",className:"inline-flex items-center gap-2 text-indigo-500 font-medium text-xs sm:text-sm hover:text-purple-600 transition-all duration-300 relative group",children:[e.jsx("svg",{className:"w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform duration-300",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M10 19l-7-7m0 0l7-7m-7 7h18"})}),e.jsx("span",{className:"hidden sm:inline",children:"Retour à la connexion"}),e.jsx("span",{className:"sm:hidden",children:"Connexion"}),e.jsx("span",{className:"absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 group-hover:w-full"})]})]}),e.jsx("div",{className:"hidden sm:block mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("svg",{className:"w-5 h-5 text-blue-500 mt-0.5",fill:"currentColor",viewBox:"0 0 20 20",children:e.jsx("path",{fillRule:"evenodd",d:"M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 7c0-5.92-4.808-10.72-10.72-10.72A10.975 10.975 0 002.166 5zM8.058 14H15.94a8.975 8.975 0 00-1.856-4.5 8.975 8.975 0 00-7.17 0 8.975 8.975 0 00-1.856 4.5z",clipRule:"evenodd"})}),e.jsxs("div",{className:"text-xs text-blue-700",children:[e.jsx("p",{className:"font-medium mb-1",children:"🔒 Sécurité garantie"}),e.jsx("p",{children:"Votre email est protégé et ne sera jamais partagé. Le lien de réinitialisation expire après 60 minutes."})]})]})})]})]}),e.jsx("style",{jsx:!0,children:`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }
                
                @keyframes float-1 {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    33% { transform: translateY(-10px) translateX(5px); }
                    66% { transform: translateY(-5px) translateX(-5px); }
                }
                
                @keyframes float-2 {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    33% { transform: translateY(-8px) translateX(-8px); }
                    66% { transform: translateY(-12px) translateX(4px); }
                }
                
                @keyframes float-3 {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    33% { transform: translateY(-6px) translateX(-6px); }
                    66% { transform: translateY(-10px) translateX(8px); }
                }
                
                @keyframes gradient-shift {
                    0%, 100% { transform: translateX(0%) translateY(0%); }
                    25% { transform: translateX(25%) translateY(-25%); }
                    50% { transform: translateX(-25%) translateY(25%); }
                    75% { transform: translateX(15%) translateY(-15%); }
                }
                
                @keyframes alert-slide {
                    from {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                
                @keyframes error-shake {
                    0%, 20%, 40%, 60%, 80% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                }
                
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                
                .animate-float-1 {
                    animation: float-1 8s ease-in-out infinite;
                }
                
                .animate-float-2 {
                    animation: float-2 10s ease-in-out infinite;
                }
                
                .animate-float-3 {
                    animation: float-3 12s ease-in-out infinite;
                }
                
                .animate-gradient-shift {
                    animation: gradient-shift 15s ease-in-out infinite;
                }
                
                .animate-alert-slide {
                    animation: alert-slide 0.4s ease-out;
                }
                
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
                
                .animate-error-shake {
                    animation: error-shake 0.5s ease-out;
                }
                
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .animate-slide-up,
                    .animate-float,
                    .animate-float-1,
                    .animate-float-2,
                    .animate-float-3,
                    .animate-gradient-shift,
                    .animate-alert-slide,
                    .animate-shimmer,
                    .animate-error-shake,
                    .animate-spin-slow {
                        animation: none;
                    }
                }
            `})]})}export{E as default};
