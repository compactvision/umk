import{K as $,r as c,m as B,j as e,$ as U,S as g}from"./app-DMwhULoG.js";import{D as X}from"./Dashboard-QU51ji3H.js";import{E as x,L as q}from"./LevelPopup-CyidPVQb.js";import{A as t}from"./sweetAlert-BfUsjs3x.js";const R=()=>{const{faculties:s,levelCodes:p}=$().props;console.log(s,p);const[k,m]=c.useState(!1),[d,b]=c.useState(!1),[f,v]=c.useState(!1),[N,z]=c.useState(null),[w,j]=c.useState(null),{data:n,setData:l,errors:u,post:C,put:_,processing:h,reset:y}=B({name:"",code:"",description:"",duration_years:"",is_active:!0}),M=()=>{m(!0),document.body.style.overflow="hidden"},L=r=>{b(!0),l({id:r.id,name:r.name,code:r.code,description:r.description,duration_years:r.duration_years,is_active:r.is_active}),m(!0)},i=()=>{m(!1),b(!1),v(!1),document.body.style.overflow="auto",y()},S=r=>{r.preventDefault(),d?(t.loading("Mise à jour en cours..."),_(route("dashboard.faculties.update",n.id),{onSuccess:()=>{t.success("Faculté mise à jour avec succès!"),i()},onError:o=>{console.error("Erreurs:",o),t.error("Une erreur s'est produite"),t.close()},onFinish:()=>{t.close()}})):C(route("dashboard.faculties.store"),{onSuccess:()=>{t.success("Faculté créée avec succès!"),y(),i()},onError:o=>{console.error("Erreurs:",o),t.error("Une erreur s'est produite")}})},E=async r=>{await t.deleteConfirm("cette faculté")&&(t.loading("Suppression en cours..."),g.delete(`/dashboard/faculties/${r}`,{onSuccess:()=>{t.success("Faculté supprimée avec succès.")},onError:a=>{console.error(a),t.error("Une erreur est survenue.")},onFinish:()=>{t.close()}}))},F=r=>{g.visit(route("dashboard.levels.show",r))},A=r=>{v(!0),z(r)},D=async r=>{await t.deleteConfirm("ce niveau")&&(t.loading("Suppression en cours..."),g.delete(`/dashboard/levels/${r}`,{onSuccess:()=>{t.success("Niveau supprimé avec succès."),i()},onError:a=>{console.error(a),t.error("Une erreur est survenue."),i()},onFinish:()=>{t.close()}}))};return e.jsx(X,{children:e.jsxs("div",{className:"container",children:[e.jsxs("div",{className:"headerr",children:[e.jsx("h1",{children:"🎓 Gestion des Facultés"}),e.jsx("p",{children:"Créez et gérez les facultés avec leurs niveaux d'études"})]}),e.jsx("div",{style:{textAlign:"center",marginTop:"20px"},children:e.jsxs("button",{className:"create-btn",onClick:M,children:[e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",children:e.jsxs("g",{fill:"none",stroke:"currentColor",strokeDasharray:"16",strokeDashoffset:"16",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",children:[e.jsx("path",{d:"M5 12h14",children:e.jsx("animate",{fill:"freeze",attributeName:"stroke-dashoffset",dur:"0.4s",values:"16;0"})}),e.jsx("path",{d:"M12 5v14",children:e.jsx("animate",{fill:"freeze",attributeName:"stroke-dashoffset",begin:"0.4s",dur:"0.4s",values:"16;0"})})]})}),e.jsx("p",{children:"Créer une nouvelle faculté"})]})}),e.jsx("div",{className:"faculties-grid",children:Array.isArray(s==null?void 0:s.data)&&s.data.length===0?e.jsxs("div",{className:"empty-state",children:[e.jsx("h3",{children:"Aucune faculté créée"}),e.jsx("p",{children:'Cliquez sur "Créer une nouvelle faculté" pour commencer'})]}):Array.isArray(s==null?void 0:s.data)&&s.data.map(r=>{const o=r.levels||[];return e.jsxs("div",{className:"faculty-card-container",onMouseEnter:()=>j(r.id),onMouseLeave:()=>j(null),children:[e.jsxs("div",{className:`faculty-card ${w===r.id?"hovered":""}`,children:[e.jsxs("div",{className:"faculty-header",children:[e.jsxs("div",{children:[e.jsx(U,{href:route("dashboard.levels.index"),className:"faculty-name",children:r.name}),e.jsx("div",{className:"faculty-code",children:r.code})]}),e.jsxs("div",{style:{display:"flex",gap:"10px"},children:[e.jsx("button",{className:"btn edit-btn",onClick:()=>L(r),children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16",children:e.jsx("path",{fill:"currentColor",d:"M10.529 1.764a2.621 2.621 0 1 1 3.707 3.707l-.779.779L9.75 2.543zM9.043 3.25L2.657 9.636a2.96 2.96 0 0 0-.772 1.354l-.87 3.386a.5.5 0 0 0 .61.608l3.385-.869a2.95 2.95 0 0 0 1.354-.772l6.386-6.386z"})})}),e.jsx("button",{className:"btn delete-btn",onClick:()=>E(r.id),children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"12",height:"12",viewBox:"0 0 512 512",children:[e.jsx("rect",{width:"448",height:"80",x:"32",y:"48",fill:"currentColor",rx:"32",ry:"32"}),e.jsx("path",{fill:"currentColor",d:"M74.45 160a8 8 0 0 0-8 8.83l26.31 252.56a1.5 1.5 0 0 0 0 .22A48 48 0 0 0 140.45 464h231.09a48 48 0 0 0 47.67-42.39v-.21l26.27-252.57a8 8 0 0 0-8-8.83Zm248.86 180.69a16 16 0 1 1-22.63 22.62L256 318.63l-44.69 44.68a16 16 0 0 1-22.63-22.62L233.37 296l-44.69-44.69a16 16 0 0 1 22.63-22.62L256 273.37l44.68-44.68a16 16 0 0 1 22.63 22.62L278.62 296Z"})]})})]})]}),e.jsxs("div",{className:"faculty-description",children:[e.jsx("p",{children:r.description}),e.jsxs("span",{className:"duration",children:["Durée: ",r.duration_years," ans"]})]})]}),e.jsxs("div",{className:`levels-submenu ${w===r.id?"show":""}`,children:[e.jsxs("div",{className:"submenu-header",children:[e.jsxs("div",{className:"submenu-title",children:[e.jsx("span",{className:"levels-icon",children:"📚"}),e.jsx("span",{children:"Niveaux d'études"})]}),e.jsxs("div",{className:"submenu-count",children:[o.length," niveau",o.length>1?"x":""]})]}),e.jsx("div",{className:"levels-list",children:o.length===0?e.jsx("div",{className:"no-levels",children:e.jsx("span",{children:"Aucun niveau configuré"})}):o.map((a,Y)=>e.jsxs("div",{className:"level-item",style:{animationDelay:`${Y*.1}s`},children:[e.jsxs("div",{className:"level-info",children:[e.jsx("div",{className:"level-name",children:a.level_name}),e.jsx("div",{className:"level-code",children:a.level_code}),e.jsxs("div",{className:"level-students",children:[e.jsx("span",{className:"student-icon",children:"👥"}),a.student_number," étudiants"]})]}),e.jsxs("div",{className:"level-actions",children:[e.jsx("button",{className:"level-btn edit-btn",onClick:()=>A(a),title:"Voir le niveau",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"14",height:"14",viewBox:"0 0 16 16",children:e.jsx("path",{fill:"currentColor",d:"M14.236 1.764a2.62 2.62 0 0 0-3.707 0L2.657 9.636a2.96 2.96 0 0 0-.772 1.354l-.87 3.386a.5.5 0 0 0 .61.608l3.385-.869a2.95 2.95 0 0 0 1.354-.772l7.872-7.872a2.62 2.62 0 0 0 0-3.707m-3 .707a1.621 1.621 0 1 1 2.293 2.293l-.779.779l-2.293-2.293zM9.75 3.957l2.293 2.293l-6.386 6.386a1.95 1.95 0 0 1-.896.51l-2.567.66l.66-2.567a1.94 1.94 0 0 1 .51-.896z"})})}),e.jsx("button",{className:"level-btn view-btn",onClick:()=>F(a),title:"Voir le niveau",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"14",height:"14",viewBox:"0 0 24 24",children:e.jsx("path",{fill:"#fff",d:"M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z"})})}),e.jsx("button",{className:"level-btn delete-btn",onClick:()=>D(a.id),title:"Supprimer le niveau",children:e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"12",height:"12",viewBox:"0 0 24 24",children:e.jsx("path",{fill:"currentColor",d:"M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z"})})})]})]},a.id))})]})]},r.id)})}),k&&e.jsx("div",{className:"modall",onClick:r=>r.target.className==="modal"&&i(),children:e.jsxs("div",{className:"modal-content",children:[e.jsxs("div",{className:"modal-header",children:[e.jsx("h2",{children:d?n.name:"🏛️ Nouvelle Faculté"}),e.jsxs("p",{children:[d?"Modifiez ":"Remplissez "," les informations de la faculté"]})]}),e.jsxs("form",{onSubmit:S,children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"name",children:"Nom de la faculté"}),e.jsx("input",{type:"text",id:"name",name:"name",placeholder:"Ex: Faculté de Médecine",value:n.name,onChange:r=>l("name",r.target.value),required:!0}),e.jsx(x,{error:u.name})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"code",children:"Code de la faculté"}),e.jsx("input",{type:"text",id:"code",name:"code",placeholder:"Ex: MED",value:n.code,onChange:r=>l("code",r.target.value.toUpperCase()),maxLength:10,required:!0}),e.jsx(x,{error:u.code})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"duration_years",children:"Durée de la faculté (en années)"}),e.jsx("input",{type:"number",id:"duration_years",name:"duration_years",placeholder:"4",min:"1",max:"10",value:n.duration_years,onChange:r=>l("duration_years",r.target.value),required:!0}),e.jsx(x,{error:u.duration_years})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"description",children:"Description"}),e.jsx("textarea",{id:"description",name:"description",placeholder:"Courte présentation de la faculté",rows:7,value:n.description,onChange:r=>l("description",r.target.value)}),e.jsx(x,{error:u.description})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"name",children:"Status"}),e.jsxs("label",{className:"toggle-switch",children:[e.jsx("input",{type:"checkbox",className:"toggle-switch__checkbox",checked:n.is_active,onChange:r=>l("is_active",r.target.checked)}),e.jsx("span",{className:"toggle-switch__slider"})]})]}),e.jsxs("div",{className:"modal-actions",children:[e.jsx("button",{type:"button",className:"btn btn-secondary",onClick:i,disabled:h,children:"Annuler"}),e.jsx("button",{type:"submit",className:"btn btn-primary",disabled:h,children:h?d?"Mise à jour...":"Création...":d?"Mettre à jour la faculté":"Créer la faculté"})]})]})]})}),f&&e.jsx(q,{faculties:s,onClose:i,isOpen:f,level:N,levelCodes:p==null?void 0:p.data}),e.jsx("style",{children:`
                    .headerr {
                        text-align: center;
                        margin-bottom: 40px;
                    }

                    .headerr h1 {
                        font-size: 2.5rem;
                        color: #2d3748;
                        margin-bottom: 10px;
                        font-weight: 700;
                    }

                    .headerr p {
                        color: #718096;
                        font-size: 1.1rem;
                    }

                    .create-btn {
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 12px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
                        margin-bottom: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin: 0 auto;
                    }

                    .create-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 25px rgba(79, 70, 229, 0.4);
                    }

                    .faculties-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                        gap: 25px;
                        margin-top: 30px;
                    }

                    /* Faculty Card Container */
                    .faculty-card-container {
                        position: relative;
                        height: fit-content;
                        z-index: 1;
                        transition: z-index 0s;
                    }

                    .faculty-card-container:hover {
                        z-index: 1000;
                    }

                    .faculty-card {
                        background: white;
                        border-radius: 16px;
                        padding: 25px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        border: 2px solid transparent;
                        position: relative;
                        z-index: 2;
                        overflow: hidden;
                    }

                    .faculty-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
                        transition: left 0.6s;
                        z-index: 1;
                    }

                    .faculty-card.hovered::before {
                        left: 100%;
                    }

                    .faculty-card.hovered {
                        transform: translateY(-8px) scale(1.02);
                        box-shadow: 0 20px 40px rgba(79, 70, 229, 0.25);
                        border-color: #4f46e5;
                        background: linear-gradient(135deg, #ffffff, #f8fafc);
                    }

                    .faculty-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: start;
                        margin-bottom: 15px;
                        position: relative;
                        z-index: 3;
                    }

                    .faculty-name {
                        text-decoration: none;
                        font-size: 1.4rem;
                        font-weight: 700;
                        color: #2d3748;
                        margin-bottom: 5px;
                        transition: color 0.3s ease;
                    }

                    .faculty-card.hovered .faculty-name {
                        color: #4f46e5;
                    }

                    .faculty-code {
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 0.9rem;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    }

                    .faculty-card.hovered .faculty-code {
                        transform: scale(1.1);
                        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
                    }

                    .faculty-description {
                        position: relative;
                        z-index: 3;
                    }

                    .faculty-description p {
                        color: #718096;
                        margin-bottom: 10px;
                        font-size: 0.95rem;
                        line-height: 1.5;
                        transition: color 0.3s ease;
                    }

                    .faculty-card.hovered .faculty-description p {
                        color: #4a5568;
                    }

                    .duration {
                        background: #f7fafc;
                        color: #4a5568;
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 0.85rem;
                        font-weight: 500;
                        transition: all 0.3s ease;
                    }

                    .faculty-card.hovered .duration {
                        background: #edf2f7;
                        transform: translateX(5px);
                    }

                    /* Levels Submenu */
                    .levels-submenu {
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 0 0 20px 20px;
                        padding: 0;
                        max-height: 0;
                        overflow: hidden;
                        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
                        z-index: 10;
                        opacity: 0;
                        transform: translateY(-20px);
                    }

                    .levels-submenu.show {
                        max-height: 600px;
                        padding: 20px;
                        opacity: 1;
                        transform: translateY(0);
                        box-shadow: 0 20px 50px rgba(102, 126, 234, 0.4);
                    }

                    .submenu-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    }

                    .submenu-title {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: white;
                        font-weight: 600;
                        font-size: 1.1rem;
                    }

                    .levels-icon {
                        font-size: 1.2rem;
                        animation: bounce 2s infinite;
                    }

                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% {
                            transform: translateY(0);
                        }
                        40% {
                            transform: translateY(-5px);
                        }
                        60% {
                            transform: translateY(-3px);
                        }
                    }

                    .submenu-count {
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 0.8rem;
                        font-weight: 500;
                    }

                    .levels-list {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .level-item {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        padding: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        transition: all 0.3s ease;
                        opacity: 0;
                        transform: translateX(-20px);
                        animation: slideInLeft 0.4s ease forwards;
                    }

                    @keyframes slideInLeft {
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }

                    .level-item:hover {
                        background: rgba(255, 255, 255, 0.2);
                        transform: translateX(5px);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    }

                    .level-info {
                        flex: 1;
                    }

                    .level-name {
                        color: white;
                        font-weight: 600;
                        font-size: 0.95rem;
                        margin-bottom: 2px;
                    }

                    .level-code {
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        padding: 2px 8px;
                        border-radius: 8px;
                        font-size: 0.75rem;
                        display: inline-block;
                        margin-bottom: 4px;
                    }

                    .level-students {
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 0.8rem;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .student-icon {
                        font-size: 0.9rem;
                    }

                    .level-actions {
                        display: flex;
                        gap: 8px;
                    }

                    .level-btn {
                        width: 32px;
                        height: 32px;
                        border: none;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    }

                    .level-btn.view-btn {
                        background: rgba(34, 197, 94, 0.2);
                        color: #22c55e;
                        border: 1px solid rgba(34, 197, 94, 0.3);
                    }

                    .level-btn.view-btn:hover {
                        background: rgba(34, 197, 94, 0.3);
                        transform: scale(1.1);
                    }

                    .level-btn.delete-btn {
                        background: rgba(239, 68, 68, 0.2);
                        color: #ef4444;
                        border: 1px solid rgba(239, 68, 68, 0.3);
                    }

                    .level-btn.delete-btn:hover {
                        background: rgba(239, 68, 68, 0.3);
                        transform: scale(1.1);
                    }

                    .no-levels {
                        text-align: center;
                        color: rgba(255, 255, 255, 0.7);
                        font-style: italic;
                        padding: 20px;
                    }

                    .btn {
                        border: none;
                        padding: 8px 12px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: all 0.3s ease;
                        position: relative;
                        z-index: 3;
                    }

                    .delete-btn {
                        background: #e53e3e;
                        color: white;
                    }

                    .delete-btn:hover {
                        background: #c53030;
                        transform: scale(1.05);
                    }

                    .edit-btn {
                        background: #0a58ca;
                        color: #fff;
                    }

                    .edit-btn:hover {
                        background: #0d6efd;
                        transform: scale(1.05);
                    }

                    /* Modal Styles */
                    .modall {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(5px);
                        z-index: 1000;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .modal-content {
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        width: 90%;
                        max-width: 500px;
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                        animation: modalAppear 0.3s ease;
                    }

                    @keyframes modalAppear {
                        from {
                            opacity: 0;
                            transform: scale(0.9);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }

                    .modal-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }

                    .modal-header h2 {
                        font-size: 1.8rem;
                        color: #2d3748;
                        margin-bottom: 10px;
                    }

                    .form-group {
                        margin-bottom: 25px;
                    }

                    .form-group label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #4a5568;
                    }

                    .form-group input,
                    .form-group textarea {
                        width: 100%;
                        padding: 12px 16px;
                        border: 2px solid #e2e8f0;
                        border-radius: 10px;
                        font-size: 1rem;
                        transition: border-color 0.3s ease;
                        box-sizing: border-box;
                    }

                    .form-group input:focus,
                    .form-group textarea:focus {
                        outline: none;
                        border-color: #4f46e5;
                    }

                    .form-group textarea {
                        resize: vertical;
                        min-height: 120px;
                    }

                    .toggle-switch {
                        position: relative;
                        display: inline-block;
                        width: 48px;
                        height: 26px;
                    }

                    .toggle-switch__checkbox {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }

                    .toggle-switch__slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #ccc;
                        transition: background-color 0.3s ease;
                        border-radius: 50px;
                    }

                    .toggle-switch__slider::before {
                        content: "";
                        position: absolute;
                        height: 20px;
                        width: 20px;
                        left: 3px;
                        bottom: 3px;
                        background-color: white;
                        transition: transform 0.3s ease;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }

                    .toggle-switch__checkbox:checked + .toggle-switch__slider {
                        background-color: #4caf50;
                    }

                    .toggle-switch__checkbox:checked + .toggle-switch__slider::before {
                        transform: translateX(22px);
                    }

                    .modal-actions {
                        display: flex;
                        gap: 15px;
                        margin-top: 30px;
                    }

                    .btn {
                        flex: 1;
                        padding: 12px 20px;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }

                    .btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .btn-primary {
                        background: linear-gradient(135deg, #4f46e5, #7c3aed);
                        color: white;
                    }

                    .btn-primary:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
                    }

                    .btn-secondary {
                        background: #e2e8f0;
                        color: #4a5568;
                    }

                    .btn-secondary:hover:not(:disabled) {
                        background: #cbd5e0;
                    }

                    .empty-state {
                        text-align: center;
                        padding: 60px 20px;
                        color: #718096;
                        grid-column: 1 / -1;
                    }

                    .empty-state h3 {
                        font-size: 1.5rem;
                        margin-bottom: 15px;
                    }

                    .empty-state p {
                        font-size: 1.1rem;
                    }

                    /* Responsive Design */
                    @media (max-width: 768px) {
                        .faculties-grid {
                            grid-template-columns: 1fr;
                            gap: 20px;
                        }

                        .faculty-card {
                            padding: 20px;
                        }

                        .levels-submenu.show {
                            padding: 15px;
                            z-index: 5;
                        }

                        .level-item {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 10px;
                        }

                        .level-actions {
                            align-self: flex-end;
                        }
                    }
                `})]})})};export{R as default};
