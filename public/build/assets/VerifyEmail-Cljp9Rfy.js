import{a,j as e,L as l}from"./app-CXoYHuvl.js";import{D as d}from"./Dashboard-PsoCD3LF.js";import{A as t}from"./sweetAlert-020wAXQ5.js";import"./app-CSz5X-I8.js";import"./index-ahlpUeho.js";import"./createLucideIcon-DmmmvW2E.js";import"./book-open-9Djya_Si.js";import"./calendar-B6Fctooh.js";import"./graduation-cap-DswhJ5y9.js";import"./x-CjfNonIH.js";import"./chevron-right-vRkiPyZJ.js";import"./trending-up-z-fXLYX6.js";import"./users-CzO-fkJo.js";import"./shield-B_rKAMgv.js";import"./user-Brp0M1Jr.js";import"./clock-Dw5nSOf1.js";import"./award-81zlL2TF.js";import"./file-text-CfwWMjZH.js";function W({status:s}){const{post:o,processing:r}=a(),n=i=>{i.preventDefault(),o(route("verification.send"),{onSuccess:()=>{t.success("Email de vérification envoyé avec succès")},onError:()=>{t.error("Erreur lors de l'envoi de l'email de vérification")}})};return e.jsxs(d,{children:[e.jsxs("div",{className:"bg-gradient-to-br from-slate-50 to-gray-100 font-sans flex items-center justify-center p-4 relative overflow-hidden",children:[e.jsxs("div",{className:"absolute inset-0 pointer-events-none",children:[e.jsx("div",{className:"absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-blue-50/20 to-transparent"}),e.jsx("div",{className:"absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-green-50/20 to-transparent"})]}),e.jsxs("div",{className:"bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md p-8 relative backdrop-blur-lg animate-slide-up",children:[e.jsx("div",{className:"flex justify-center mb-8",children:e.jsxs("svg",{viewBox:"0 0 64 64",fill:"none",xmlns:"http://www.w3.org/2000/svg",className:"w-20 h-20 text-blue-500",children:[e.jsx("circle",{cx:"32",cy:"32",r:"28",stroke:"currentColor",strokeWidth:"2",fill:"none",strokeDasharray:"4 4",className:"animate-spin-slow"}),e.jsx("path",{d:"M32 12v8m0 24v8m12-20h-8m-24 0h8",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"}),e.jsx("circle",{cx:"32",cy:"32",r:"3",fill:"currentColor"})]})}),e.jsxs("div",{className:"text-center",children:[e.jsx("h1",{className:"text-3xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight",children:"Vérifiez votre adresse email"}),e.jsx("p",{className:"text-lg text-gray-600 leading-relaxed mb-8",children:"Nous avons envoyé un lien de vérification à votre adresse email. Cliquez sur le lien pour activer votre compte et accéder à toutes les fonctionnalités."}),e.jsxs("div",{className:"flex items-center justify-center gap-2 bg-blue-50 text-blue-600 p-3 rounded-xl text-sm font-medium mb-8 border border-blue-100",children:[e.jsx("svg",{className:"w-5 h-5 flex-shrink-0",viewBox:"0 0 24 24",fill:"none",children:e.jsx("path",{d:"M3 8L12 13L21 8M3 8V16C3 16.5523 3.44772 17 4 17H20C20.5523 17 21 16.5523 21 16V8M3 8C3 7.44772 3.44772 7 4 7H20C20.5523 7 21 7.44772 21 8",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})}),e.jsx("span",{children:"Vérifiez également votre dossier spam"})]}),s==="verification-link-sent"&&e.jsxs("div",{className:"bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-start gap-2 text-left animate-fade-in",children:[e.jsx("svg",{className:"w-5 h-5 text-green-600 flex-shrink-0 mt-0.5",viewBox:"0 0 20 20",fill:"currentColor",children:e.jsx("path",{fillRule:"evenodd",d:"M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",clipRule:"evenodd"})}),e.jsxs("div",{children:[e.jsx("strong",{className:"text-green-600 font-semibold block mb-1",children:"Email envoyé avec succès !"}),e.jsx("p",{className:"text-green-700 text-sm leading-relaxed",children:"Un nouveau lien de vérification vient d'être envoyé à votre adresse email."})]})]}),e.jsx("form",{onSubmit:n,className:"mb-8",children:e.jsxs("button",{type:"submit",className:`w-full bg-blue-500 text-white rounded-xl p-4 font-semibold text-base flex items-center justify-center gap-2 min-h-[48px] relative overflow-hidden transition-all duration-200 hover:bg-blue-600 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${r?"disabled":""}`,disabled:r,children:[r?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-5 h-5 border-2 border-white/30 rounded-full border-t-white animate-spin"}),e.jsx("span",{children:"Envoi en cours..."})]}):e.jsxs(e.Fragment,{children:[e.jsxs("svg",{className:"w-5 h-5 flex-shrink-0",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("path",{d:"M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z",stroke:"currentColor",strokeWidth:"2"}),e.jsx("path",{d:"M22 6L12 13L2 6",stroke:"currentColor",strokeWidth:"2"})]}),"Renvoyer l'email de vérification"]}),e.jsx("span",{className:"absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-all duration-500"})]})}),e.jsxs("div",{className:"border-t border-gray-100 pt-6",children:[e.jsx("p",{className:"text-gray-500 text-sm mb-4",children:"Vous n'avez pas reçu l'email ?"}),e.jsxs("div",{className:"flex gap-6 justify-center flex-wrap",children:[e.jsxs(l,{href:route("logout"),method:"post",as:"button",className:"flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",children:[e.jsxs("svg",{className:"w-4 h-4",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("path",{d:"M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"M16 17L21 12L16 7",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"M21 12H9",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})]}),"Se déconnecter"]}),e.jsxs("button",{type:"button",className:"flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",children:[e.jsxs("svg",{className:"w-4 h-4",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"2"}),e.jsx("path",{d:"M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"}),e.jsx("path",{d:"H12V16H12.01",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"})]}),"Besoin d'aide ?"]})]})]})]})]})]}),e.jsx("style",{jsx:!0,children:`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fade-in {
                    from { 
                        opacity: 0; 
                        transform: scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1); 
                    }
                }
                
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.6s ease-out;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
                
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .animate-slide-up,
                    .animate-fade-in,
                    .animate-spin-slow {
                        animation: none;
                    }
                }
            `})]})}export{W as default};
