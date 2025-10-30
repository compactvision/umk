import{j as l}from"./app-DMwhULoG.js";function e({label:t="Retour"}){const a=()=>{window.history.length>1?window.history.back():window.location.href="/"};return l.jsxs(l.Fragment,{children:[l.jsxs("button",{className:"back-button",onClick:a,children:[l.jsx("span",{className:"back-button__icon",children:l.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",children:l.jsxs("g",{fill:"none",fillRule:"evenodd",children:[l.jsx("path",{d:"M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"}),l.jsx("path",{fill:"currentColor",d:"M2.614 5.426A1.5 1.5 0 0 1 4 4.5h10a7.5 7.5 0 1 1 0 15H5a1.5 1.5 0 0 1 0-3h9a4.5 4.5 0 1 0 0-9H7.621l.94.94a1.5 1.5 0 0 1-2.122 2.12l-3.5-3.5a1.5 1.5 0 0 1-.325-1.634"})]})})}),l.jsx("span",{className:"back-button__label",children:t})]}),l.jsx("style",{children:`
            .back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);
    margin-bottom: 1rem;
}

.back-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(118, 75, 162, 0.4);
}

.back-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(118, 75, 162, 0.2);
}

.back-button__icon {
    font-size: 1.2rem;
    transition: transform 0.3s ease;
}

.back-button:hover .back-button__icon {
    transform: translateX(-4px);
}

.back-button__label {
    font-size: 1rem;
    letter-spacing: 0.5px;
}

            `})]})}export{e as B};
