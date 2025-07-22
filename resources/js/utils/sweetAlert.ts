import Swal, { SweetAlertResult, SweetAlertOptions } from 'sweetalert2';

// Configuration par défaut pour les options communes
const defaultOptions: SweetAlertOptions = {
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33',
  confirmButtonText: 'Confirmer',
  cancelButtonText: 'Annuler',
  reverseButtons: true,
  focusConfirm: false,
  focusCancel: true
};

// Configuration Toast
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

// Interface pour les méthodes Alert
interface AlertMethods {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  modal: {
    success: (message: string, title?: string) => Promise<SweetAlertResult>;
    error: (message: string, title?: string) => Promise<SweetAlertResult>;
    warning: (message: string, title?: string) => Promise<SweetAlertResult>;
    info: (message: string, title?: string) => Promise<SweetAlertResult>;
  };
  confirm: (message: string, title?: string) => Promise<SweetAlertResult>;
  deleteConfirm: (message?: string, title?: string) => Promise<Boolean>;
  loading: (message?: string) => void;
  close: () => void;
}

// Fonctions utilitaires
export const Alert: AlertMethods = {
  // Notifications toast
  success: (message: string, title = 'Succès!') => {
    Toast.fire({
      icon: 'success',
      title: title,
      text: message
    });
  },

  error: (message: string, title = 'Erreur!') => {
    Toast.fire({
      icon: 'error',
      title: title,
      text: message
    });
  },

  warning: (message: string, title = 'Attention!') => {
    Toast.fire({
      icon: 'warning',
      title: title,
      text: message
    });
  },

  info: (message: string, title = 'Information') => {
    Toast.fire({
      icon: 'info',
      title: title,
      text: message
    });
  },

  // Alertes modales
  modal: {
    success: (message: string, title = 'Succès!') => {
      return Swal.fire({
        ...defaultOptions,
        title: title,
        text: message,
        icon: 'success'
      });
    },

    error: (message: string, title = 'Erreur!') => {
      return Swal.fire({
        ...defaultOptions,
        title: title,
        text: message,
        icon: 'error'
      });
    },

    warning: (message: string, title = 'Attention!') => {
      return Swal.fire({
        ...defaultOptions,
        title: title,
        text: message,
        icon: 'warning'
      });
    },

    info: (message: string, title = 'Information') => {
      return Swal.fire({
        ...defaultOptions,
        title: title,
        text: message,
        icon: 'info'
      });
    }
  },

  // Confirmation
  confirm: (message: string, title = 'Confirmation') => {
    return Swal.fire({
      ...defaultOptions,
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, confirmer!',
      cancelButtonText: 'Annuler'
    });
  },

  // Confirmation de suppression
    deleteConfirm: async (message = 'Cette action ne peut pas être annulée!', title = 'Êtes-vous sûr?') => {
        const result = await Swal.fire({
            ...defaultOptions,
            title: title,
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'blue',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer!',
            cancelButtonText: 'Annuler'
        });

        return result.isConfirmed;
    },


    // Loading
  loading: (message = 'Traitement en cours...') => {
    Swal.fire({
      title: message,
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },

  // Fermer le loading
  close: () => {
    Swal.close();
  }
};

export default Alert;
