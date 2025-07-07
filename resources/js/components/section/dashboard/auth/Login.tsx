import React, { useState, useEffect } from 'react';

const DashboardLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState('idle'); // idle, loading, success, error
  const [focusedField, setFocusedField] = useState(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginStatus('loading');

    // Simulation d'une connexion
    setTimeout(() => {
      setLoginStatus('success');
      setIsLoading(false);
      
      setTimeout(() => {
        setLoginStatus('idle');
      }, 2000);
    }, 2000);
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Connexion avec ${provider}`);
    // Logique de connexion sociale
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    
    backgroundAnimated: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
      animation: 'bgMove 20s ease-in-out infinite',
      pointerEvents: 'none'
    },
    
    floatingElements: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      overflow: 'hidden'
    },
    
    floatingElement: {
      position: 'absolute' as const,
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '50%',
      animation: 'float 6s ease-in-out infinite'
    } as React.CSSProperties,
    
    floatingElement1: {
      width: '80px',
      height: '80px',
      top: '20%',
      left: '10%',
      animationDelay: '0s'
    } as React.CSSProperties,
    
    floatingElement2: {
      width: '120px',
      height: '120px',
      top: '60%',
      right: '10%',
      animationDelay: '2s'
    } as React.CSSProperties,
    
    floatingElement3: {
      width: '60px',
      height: '60px',
      bottom: '20%',
      left: '20%',
      animationDelay: '4s'
    } as React.CSSProperties,
    
    loginContainer: {
      width: '100%',
      maxWidth: '440px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      padding: '3rem',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transform: 'translateY(20px)',
      animation: 'slideIn 0.8s ease-out forwards',
      position: 'relative',
      zIndex: 1
    },
    
    header: {
      textAlign: 'center',
      marginBottom: '2.5rem'
    },
    
    logo: {
      width: '70px',
      height: '70px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.5rem',
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: 'white',
      boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
      transform: 'scale(1)',
      transition: 'transform 0.3s ease'
    },
    
    title: {
      fontSize: '2.2rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0.5rem',
      animation: 'titleGlow 3s ease-in-out infinite'
    },
    
    subtitle: {
      color: '#666',
      fontSize: '1.1rem',
      fontWeight: '400'
    },
    
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    
    formGroup: {
      position: 'relative',
      transition: 'transform 0.3s ease'
    },
    
    input: {
      width: '100%',
      padding: '1.2rem 1.5rem',
      border: '2px solid #e2e8f0',
      borderRadius: '16px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.8)',
      outline: 'none',
      boxSizing: 'border-box'
    },
    
    inputFocused: {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
      transform: 'translateY(-2px)'
    },
    
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      margin: '1rem 0'
    },
    
    rememberMe: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
      color: '#64748b',
      cursor: 'pointer'
    },
    
    checkbox: {
      width: '18px',
      height: '18px',
      borderRadius: '4px',
      cursor: 'pointer',
      accentColor: '#667eea'
    },
    
    forgotPassword: {
      color: '#667eea',
      textDecoration: 'none',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'color 0.3s ease'
    },
    
    submitButton: {
      width: '100%',
      padding: '1.2rem',
      background: loginStatus === 'loading' 
        ? 'linear-gradient(135deg, #4c51bf, #553c9a)'
        : loginStatus === 'success' 
        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
        : 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)',
      position: 'relative',
      overflow: 'hidden',
      transform: 'translateY(0)'
    },
    
    submitButtonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 24px rgba(102, 126, 234, 0.6)'
    },
    
    divider: {
      textAlign: 'center',
      margin: '2rem 0',
      position: 'relative',
      color: '#94a3b8',
      fontSize: '0.9rem'
    },
    
    dividerLine: {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: '1px',
      background: '#e2e8f0'
    },
    
    dividerText: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '0 1rem',
      position: 'relative',
      zIndex: 1
    },
    
    socialButtons: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem',
      marginBottom: '2rem'
    },
    
    socialButton: {
      padding: '0.8rem',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      background: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.9rem',
      fontWeight: '500',
      transform: 'translateY(0)'
    },
    
    socialButtonGoogle: {
      color: '#ea4335',
      borderColor: '#ea4335'
    },
    
    socialButtonFacebook: {
      color: '#1877f2',
      borderColor: '#1877f2'
    },
    
    socialButtonTwitter: {
      color: '#1da1f2',
      borderColor: '#1da1f2'
    },
    
    signupLink: {
      textAlign: 'center',
      color: '#64748b',
      fontSize: '0.9rem'
    },
    
    signupLinkAnchor: {
      color: '#667eea',
      textDecoration: 'none',
      fontWeight: '600'
    },
    
    footer: {
      position: 'absolute',
      bottom: '2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '0.85rem',
      zIndex: 1
    },
    
    footerLogo: {
      fontWeight: '700',
      fontSize: '1.2rem',
      marginBottom: '0.5rem'
    },
    
    footerLinks: {
      margin: '1rem 0'
    },
    
    footerLink: {
      color: 'rgba(255, 255, 255, 0.8)',
      textDecoration: 'none',
      margin: '0 0.5rem',
      transition: 'color 0.3s ease'
    },
    
    spinner: {
      display: 'inline-block',
      animation: 'spin 1s linear infinite',
      marginRight: '0.5rem'
    }
  };

  // Effet pour le logo qui pulse
  useEffect(() => {
    const logo = document.querySelector('.logo');
    if (logo) {
      const interval = setInterval(() => {
        logo.style.transform = 'scale(1.05)';
        setTimeout(() => {
          logo.style.transform = 'scale(1)';
        }, 200);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  const getButtonText = () => {
    switch(loginStatus) {
      case 'loading':
        return (
          <>
            <span style={styles.spinner}>⟳</span>
            Connexion en cours...
          </>
        );
      case 'success':
        return '✓ Connexion réussie !';
      default:
        return 'Se connecter';
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          
          @keyframes bgMove {
            0%, 100% { transform: translateX(0px) translateY(0px); }
            50% { transform: translateX(20px) translateY(-20px); }
          }
          
          @keyframes titleGlow {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.2); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 480px) {
            .login-container {
              padding: 2rem;
              margin: 1rem;
            }
            
            .social-buttons {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      
      <div style={styles.container}>
        <div style={styles.backgroundAnimated}></div>
        
        <div style={styles.floatingElements}>
          <div style={{...styles.floatingElement, ...styles.floatingElement1}}></div>
          <div style={{...styles.floatingElement, ...styles.floatingElement2}}></div>
          <div style={{...styles.floatingElement, ...styles.floatingElement3}}></div>
        </div>

        <div style={styles.loginContainer} className="login-container">
          <div style={styles.header}>
            <div 
              style={styles.logo} 
              className="logo"
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              L
            </div>
            <h2 style={styles.title}>Bienvenue sur Luma</h2>
            <p style={styles.subtitle}>Connectez-vous à votre espace étudiant</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...styles.input,
                  ...(focusedField === 'email' ? styles.inputFocused : {})
                }}
                placeholder="Adresse email"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...styles.input,
                  ...(focusedField === 'password' ? styles.inputFocused : {})
                }}
                placeholder="Mot de passe"
                required
              />
            </div>

            <div style={styles.actions}>
              <label style={styles.rememberMe}>
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                Se souvenir de moi
              </label>
              <a 
                href="#" 
                style={styles.forgotPassword}
                onMouseEnter={(e) => e.target.style.color = '#5a67d8'}
                onMouseLeave={(e) => e.target.style.color = '#667eea'}
              >
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              style={styles.submitButton}
              disabled={isLoading}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  Object.assign(e.target.style, styles.submitButtonHover);
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {getButtonText()}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>ou connectez-vous avec</span>
          </div>

          <div style={styles.socialButtons} className="social-buttons">
            {[
              { name: 'Google', style: styles.socialButtonGoogle, hoverBg: '#ea4335' },
              { name: 'Facebook', style: styles.socialButtonFacebook, hoverBg: '#1877f2' },
              { name: 'Twitter', style: styles.socialButtonTwitter, hoverBg: '#1da1f2' }
            ].map(({ name, style, hoverBg }) => (
              <button
                key={name}
                style={{ ...styles.socialButton, ...style }}
                onClick={() => handleSocialLogin(name)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = hoverBg;
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = hoverBg;
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {name}
              </button>
            ))}
          </div>

          <div style={styles.signupLink}>
            Pas encore de compte ?{' '}
            <a 
              href="#" 
              style={styles.signupLinkAnchor}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Créer un compte
            </a>
          </div>
        </div>

        <footer style={styles.footer}>
          <div style={styles.footerLogo}>Luma</div>
          <div>Plateforme d'apprentissage moderne conçue pour les étudiants d'aujourd'hui</div>
          <div style={styles.footerLinks}>
            <a 
              href="#" 
              style={styles.footerLink}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Conditions d'utilisation
            </a>
            <a 
              href="#" 
              style={styles.footerLink}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Politique de confidentialité
            </a>
            <a 
              href="#" 
              style={styles.footerLink}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Support
            </a>
          </div>
          <div>© 2025 Luma. Tous droits réservés.</div>
        </footer>
      </div>
    </>
  );
};

export default DashboardLogin;