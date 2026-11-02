import{a as P,r as o,j as e}from"./app-f_A2OO45.js";import{D as A}from"./Dashboard-Df1cKreS.js";import{A as h}from"./sweetAlert-020wAXQ5.js";import{S as p}from"./shield-check-DiRt19gV.js";import{M as E}from"./mail-B_0qibRp.js";import{C as u}from"./circle-alert-uDqgh0oq.js";import{K as F}from"./key-round-HvtdnPFM.js";import{E as f}from"./eye-off-CVgEzgm_.js";import{E as b}from"./eye-Q7r3sr4d.js";import{L as _}from"./lock-keyhole-CBMhr4Ts.js";import"./app-DLqUpe3O.js";import"./book-open-foUhBVdO.js";import"./createLucideIcon-CsfUAmTq.js";import"./wallet-C8VL7Y37.js";import"./users-CcJK7k9D.js";import"./graduation-cap-DS6UIhab.js";import"./layers-Cjomi4UW.js";import"./chevron-right-DbwvbxXO.js";import"./x-BQmRTQSS.js";import"./file-pen-line-B4hMU6cc.js";import"./menu-CxYEIyiY.js";import"./arrow-up-right-CSkjjN2G.js";import"./user-round-DhnvYmDp.js";import"./clipboard-check-DmvcIG8O.js";import"./landmark-SwnZfYgS.js";import"./shield-FXaNJ31H.js";import"./user-CcSSiDHw.js";function ne({token:g,email:w}){const{data:t,setData:m,post:v,processing:c,errors:a}=P({token:g,email:w||"",password:"",password_confirmation:""}),j=r=>{r.preventDefault(),t.email,t.password,t.password,t.password_confirmation,v(route("password.update"),{onSuccess:()=>{h.success("Mot de passe réinitialisé avec succès!")},onError:()=>{h.error("Une erreur est survenue lors de la réinitialisation de votre mot de passe.")}})},[x,s]=o.useState(null),[n,k]=o.useState(0),[l,N]=o.useState(!1),[d,y]=o.useState(!1),z=r=>{let i=0;return r.length>=8&&(i+=1),/[a-z]/.test(r)&&(i+=1),/[A-Z]/.test(r)&&(i+=1),/[0-9]/.test(r)&&(i+=1),/[^A-Za-z0-9]/.test(r)&&(i+=1),i};o.useEffect(()=>{k(z(t.password))},[t.password]);const S=()=>{switch(n){case 0:case 1:return"bg-red-500";case 2:return"bg-orange-500";case 3:return"bg-yellow-500";case 4:return"bg-green-500";case 5:return"bg-green-600";default:return"bg-gray-200"}},C=()=>{switch(n){case 0:case 1:return"text-red-500";case 2:return"text-orange-500";case 3:return"text-yellow-500";case 4:return"text-green-500";case 5:return"text-green-600";default:return"text-gray-200"}},W=()=>{switch(n){case 0:case 1:return"Très faible";case 2:return"Faible";case 3:return"Moyen";case 4:return"Fort";case 5:return"Très fort";default:return""}};return e.jsxs(A,{children:[e.jsxs("div",{className:"relative flex items-center justify-center overflow-hidden p-5 font-sans",children:[e.jsx("div",{className:"absolute inset-0 animate-pulse bg-gradient-to-br from-emerald-50 via-emerald-50 to-teal-50"}),e.jsxs("div",{className:"animate-slide-up relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/98 p-12 shadow-2xl backdrop-blur-xl",children:[e.jsxs("div",{className:"mb-10 text-center",children:[e.jsxs("div",{className:"relative mx-auto mb-6 flex h-20 w-20 animate-pulse items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/40",children:[e.jsx("div",{className:"animate-spin-slow absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"}),e.jsx("span",{className:"relative z-10 text-3xl",children:e.jsx(p,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})})]}),e.jsx("h1",{className:"mb-3 bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent",children:"Nouveau mot de passe"}),e.jsx("p",{className:"text-base leading-relaxed text-gray-500",children:"Créez un mot de passe sécurisé pour protéger votre compte"})]}),e.jsxs("div",{className:"space-y-7",children:[e.jsxs("div",{className:"relative",children:[e.jsxs("div",{className:"relative flex items-center",children:[e.jsx("input",{type:"email",name:"email",value:t.email,onChange:r=>m({...t,email:r.target.value}),className:"h-16 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 pl-16 text-base font-medium text-slate-900 transition-all duration-300 outline-none focus:-translate-y-1 focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10",placeholder:"votre.email@exemple.com",required:!0,onFocus:()=>s("email"),onBlur:()=>s(null),readOnly:!0}),e.jsx("div",{className:"absolute left-6 z-10 text-xl text-gray-400 transition-all duration-300",children:e.jsx(E,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})})]}),a.email&&e.jsxs("div",{className:"animate-error-bounce mt-2.5 flex items-center gap-2 rounded-lg border-l-3 border-red-500 bg-red-50 p-2 text-sm font-medium text-red-500",children:[e.jsx("span",{children:e.jsx(u,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})}),a.email]})]}),e.jsxs("div",{className:"relative",children:[e.jsxs("div",{className:"relative flex items-center",children:[e.jsx("input",{type:l?"text":"password",name:"password",value:t.password,onChange:r=>m({...t,password:r.target.value}),className:"h-16 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 pr-16 pl-16 text-base font-medium text-slate-900 transition-all duration-300 outline-none focus:-translate-y-1 focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10",placeholder:"Nouveau mot de passe",required:!0,onFocus:()=>s("password"),onBlur:()=>s(null)}),e.jsx("div",{className:`absolute left-6 z-10 text-xl transition-all duration-300 ${x==="password"?"scale-110 text-emerald-500":"text-gray-400"}`,children:e.jsx(F,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})}),e.jsx("button",{type:"button",className:"absolute right-5 z-20 rounded-lg p-1 text-lg text-gray-400 transition-all duration-300 hover:bg-emerald-50 hover:text-emerald-500","aria-label":l?"Masquer le mot de passe":"Afficher le mot de passe",onClick:()=>N(!l),children:l?e.jsx(f,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"}):e.jsx(b,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})})]}),t.password&&e.jsxs("div",{className:"mt-3 flex items-center gap-1",children:[[1,2,3,4,5].map(r=>e.jsx("div",{className:`h-1 flex-1 rounded-full transition-all duration-300 ${r<=n?S():"bg-gray-200"}`},r)),e.jsx("div",{className:`ml-2 min-w-[70px] text-xs font-semibold ${C()}`,children:W()})]}),a.password&&e.jsxs("div",{className:"animate-error-bounce mt-2.5 flex items-center gap-2 rounded-lg border-l-3 border-red-500 bg-red-50 p-2 text-sm font-medium text-red-500",children:[e.jsx("span",{children:e.jsx(u,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})}),a.password]})]}),e.jsxs("div",{className:"relative",children:[e.jsxs("div",{className:"relative flex items-center",children:[e.jsx("input",{type:d?"text":"password",name:"password_confirmation",value:t.password_confirmation,onChange:r=>m({...t,password_confirmation:r.target.value}),className:"h-16 w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-6 pr-16 pl-16 text-base font-medium text-slate-900 transition-all duration-300 outline-none focus:-translate-y-1 focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10",placeholder:"Confirmer le nouveau mot de passe",required:!0,onFocus:()=>s("confirm"),onBlur:()=>s(null)}),e.jsx("div",{className:`absolute left-6 z-10 text-xl transition-all duration-300 ${x==="confirm"?"scale-110 text-emerald-500":"text-gray-400"}`,children:e.jsx(p,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})}),e.jsx("button",{type:"button",className:"absolute right-5 z-20 rounded-lg p-1 text-lg text-gray-400 transition-all duration-300 hover:bg-emerald-50 hover:text-emerald-500","aria-label":d?"Masquer la confirmation du mot de passe":"Afficher la confirmation du mot de passe",onClick:()=>y(!d),children:d?e.jsx(f,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"}):e.jsx(b,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})})]}),a.password_confirmation&&e.jsxs("div",{className:"animate-error-bounce mt-2.5 flex items-center gap-2 rounded-lg border-l-3 border-red-500 bg-red-50 p-2 text-sm font-medium text-red-500",children:[e.jsx("span",{children:e.jsx(u,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})}),a.password_confirmation]})]}),e.jsxs("button",{type:"button",className:"relative h-16 cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-base text-sm font-bold tracking-wide text-white uppercase shadow-lg shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/50 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",disabled:c,onClick:j,children:[e.jsx("span",{className:"absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-600 hover:translate-x-full"}),c&&e.jsx("div",{className:"mr-2.5 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"}),c?"Réinitialisation...":"Réinitialiser le mot de passe"]})]}),e.jsxs("div",{className:"mt-8 rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-5 text-center text-sm leading-relaxed text-green-600",children:[e.jsx("span",{className:"mb-2 block text-xl",children:e.jsx(_,{size:18,strokeWidth:1.8,"aria-hidden":"true",className:"inline-block shrink-0 align-middle"})}),"Votre mot de passe sera chiffré et stocké de manière sécurisée. Assurez-vous qu'il contient au moins 8 caractères avec des lettres, chiffres et symboles."]})]})]}),e.jsx("style",{jsx:!0,children:`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(40px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes error-bounce {
                    0%,
                    20%,
                    40%,
                    60%,
                    80% {
                        transform: translateX(0);
                    }
                    10%,
                    30%,
                    50%,
                    70%,
                    90% {
                        transform: translateX(-3px);
                    }
                }

                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                .animate-slide-up {
                    animation: slide-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .animate-error-bounce {
                    animation: error-bounce 0.6s ease-out;
                }

                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    .animate-slide-up,
                    .animate-error-bounce,
                    .animate-spin-slow {
                        animation: none;
                    }
                }
            `})]})}export{ne as default};
