import React, { useState, useEffect } from 'react';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Afficher le preloader pendant 2 secondes

    return () => clearTimeout(timer); // Nettoyer le timer à la fin
  }, []);

  if (!isLoading) return null; // Ne pas afficher le composant si le chargement est terminé

  return (
    <div id="preloader" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div id="loader" className="loader">
        <div className="loader-container">
          <div className="loader-icon">
            <img src="/assets/img/logo/logo.png" alt="logo" style={{ width: '50px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
