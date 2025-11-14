import { Link, router } from '@inertiajs/react';
import { 
  AlertCircle, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileCheck2, 
  FileText, 
  MapPin, 
  User, 
  Download,
  Mail,
  Phone,
  Globe,
  Home,
  CreditCard,
  XCircle,
  Award,
  UserCheck,
  FileX,
  Eye,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import { useState } from 'react';

type Level = { 
  id: number; 
  title?: string | null; 
  title_ar?: string | null; 
  code?: string | null;
  faculty?: { name?: string | null };
  department?: { name?: string | null };
  duration?: string | null;
  description?: string | null;
};

type Document = { 
  id: number; 
  type: string; 
  name: string;
  verified: boolean;
  url?: string | null;
  required: boolean;
  uploaded_at?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
};

type StatusHistory = {
  id: number;
  status: string;
  created_at: string;
  notes?: string | null;
  user?: { name: string } | null;
};

type Enrollment = {
    id: number;
    uuid?: string | null;
    matricule?: string | null;
    status: 'draft' | 'submitted' | 'in_review' | 'pending_documents' | 'validated' | 'rejected' | 'archived' | string;
    payment_status?: 'unpaid' | 'partial' | 'paid' | string | null;
    created_at?: string | null;
    updated_at?: string | null;
    enrolled_at?: string | null;
    notes?: string | null;
    rejection_reason?: string | null;
    level?: Level | null;
    documents?: Document[] | null;
    status_history?: StatusHistory[] | null;
    student?: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      country?: string | null;
      birth_date?: string | null;
      birth_place?: string | null;
      nationality?: string | null;
      gender?: string | null;
    };
};

type CandidatureDetailProps = {
  enrollment: Enrollment;
  canPrint?: boolean;
  canDownload?: boolean;
};

export default function CandidatureDetail({ enrollment, canPrint = true, canDownload = true }: CandidatureDetailProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history'>('details');
  
  // Formater la date
  const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—');
  const fmtDateTime = (v?: string | null) => (v ? new Date(v).toLocaleString('fr-FR') : '—');
  
  // Configuration des statuts
  const getStatusConfig = (status: Enrollment['status']) => {
    const map: Record<string, { label: string; className: string; icon: JSX.Element }> = {
      draft: {
        label: 'Brouillon',
        className: 'bg-blue-100 text-blue-600',
        icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      submitted: { 
        label: 'Soumise', 
        className: 'bg-cyan-100 text-cyan-600', 
        icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" /> 
      },
      in_review: {
        label: 'En vérification',
        className: 'bg-amber-100 text-amber-600',
        icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      pending_documents: {
        label: 'Compléments requis',
        className: 'bg-orange-100 text-orange-600',
        icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      validated: {
        label: 'Validée',
        className: 'bg-green-100 text-green-600',
        icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      rejected: {
        label: 'Rejetée',
        className: 'bg-red-100 text-red-600',
        icon: <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      archived: {
        label: 'Archivée',
        className: 'bg-gray-100 text-gray-600',
        icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
    };
    return map[status as string] ?? map['draft'];
  };

  // Configuration du statut de paiement
  const getPaymentStatusConfig = (status?: Enrollment['payment_status']) => {
    const map: Record<string, { label: string; className: string; icon: JSX.Element }> = {
      paid: {
        label: 'Payée',
        className: 'bg-green-100 text-green-600',
        icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      partial: {
        label: 'Paiement partiel',
        className: 'bg-amber-100 text-amber-600',
        icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
      unpaid: {
        label: 'Non payée',
        className: 'bg-gray-100 text-gray-600',
        icon: <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />,
      },
    };
    return map[status as string] ?? map['unpaid'];
  };

  // Obtenir la configuration du statut de l'historique
  const getHistoryStatusConfig = (status: string) => {
    const map: Record<string, { label: string; className: string; icon: JSX.Element }> = {
      draft: {
        label: 'Brouillon',
        className: 'bg-blue-100 text-blue-600',
        icon: <Calendar className="w-4 h-4" />,
      },
      submitted: { 
        label: 'Soumise', 
        className: 'bg-cyan-100 text-cyan-600', 
        icon: <Clock className="w-4 h-4" /> 
      },
      in_review: {
        label: 'En vérification',
        className: 'bg-amber-100 text-amber-600',
        icon: <AlertCircle className="w-4 h-4" />,
      },
      pending_documents: {
        label: 'Compléments requis',
        className: 'bg-orange-100 text-orange-600',
        icon: <FileText className="w-4 h-4" />,
      },
      validated: {
        label: 'Validée',
        className: 'bg-green-100 text-green-600',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      rejected: {
        label: 'Rejetée',
        className: 'bg-red-100 text-red-600',
        icon: <XCircle className="w-4 h-4" />,
      },
      archived: {
        label: 'Archivée',
        className: 'bg-gray-100 text-gray-600',
        icon: <FileText className="w-4 h-4" />,
      },
    };
    return map[status] ?? map['draft'];
  };

  const statusConfig = getStatusConfig(enrollment.status);
  const paymentConfig = getPaymentStatusConfig(enrollment.payment_status);
  const student = enrollment.student;
  const level = enrollment.level;
  const documents = enrollment.documents || [];
  const history = enrollment.status_history || [];
  
  // Calculer les statistiques des documents
  const totalDocuments = documents.length;
  const verifiedDocuments = documents.filter(doc => doc.verified).length;
  const requiredDocuments = documents.filter(doc => doc.required).length;
  const requiredVerifiedDocuments = documents.filter(doc => doc.required && doc.verified).length;
  
  // Gérer le téléchargement
  const handleDownload = () => {
    window.open(route('dashboard.enrollments.download', { uuid: enrollment.uuid }), '_blank');
  };
  
  // Gérer l'impression
  const handlePrint = () => {
    window.print();
  };
  
  // Obtenir le nom du type de document
  const getDocumentTypeName = (type: string) => {
    const types: Record<string, string> = {
      'birth_certificate': 'Acte de naissance',
      'national_id': 'Carte d\'identité nationale',
      'passport': 'Passeport',
      'diploma': 'Diplôme',
      'transcript': 'Relevé de notes',
      'recommendation_letter': 'Lettre de recommandation',
      'motivation_letter': 'Lettre de motivation',
      'cv': 'CV',
      'photo': 'Photo d\'identité',
      'medical_certificate': 'Certificat médical',
      'other': 'Autre'
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 print:bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden mb-4 sm:mb-6 print:shadow-none">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 sm:p-6 text-white">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                    Détails de la candidature
                  </h1>
                  <div className="flex items-center gap-2 text-blue-100">
                    <span className="text-xs sm:text-sm">Référence:</span>
                    <span className="font-mono bg-white/20 px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">
                      {enrollment.matricule || enrollment.uuid || '—'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${statusConfig.className}`}>
                  {statusConfig.icon}
                  <span className="hidden xs:inline">{statusConfig.label}</span>
                  <span className="xs:hidden">{statusConfig.label.split(' ')[0]}</span>
                </div>
                
                {enrollment.payment_status && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${paymentConfig.className}`}>
                    {paymentConfig.icon}
                    <span className="hidden sm:inline">{paymentConfig.label}</span>
                    <span className="sm:hidden">{paymentConfig.label.split(' ')[0]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-3 sm:p-4 bg-gray-50 border-t flex flex-wrap gap-2 sm:gap-3 justify-end print:hidden">
            {canDownload && (
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Télécharger</span>
              </button>
            )}
            
            {canPrint && (
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
            )}
            
            <Link 
              href={route('dashboard.enrollments.index')}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Retour</span>
            </Link>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden mb-4 sm:mb-6 print:shadow-none">
          <div className="flex border-b overflow-x-auto">
            <button
              className={`flex-1 min-w-[100px] px-2 sm:px-4 py-3 text-center font-medium transition-colors text-xs sm:text-sm ${
                activeTab === 'details' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('details')}
            >
              <span className="hidden sm:inline">Informations générales</span>
              <span className="sm:hidden">Informations</span>
            </button>
            
            <button
              className={`flex-1 min-w-[100px] px-2 sm:px-4 py-3 text-center font-medium transition-colors text-xs sm:text-sm ${
                activeTab === 'documents' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('documents')}
            >
              Documents ({verifiedDocuments}/{totalDocuments})
            </button>
            
            <button
              className={`flex-1 min-w-[100px] px-2 sm:px-4 py-3 text-center font-medium transition-colors text-xs sm:text-sm ${
                activeTab === 'history' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('history')}
            >
              Historique
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-3 sm:p-4 md:p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Student Information */}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    Informations étudiant
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Nom complet</p>
                        <p className="font-medium text-sm sm:text-base truncate">{student?.first_name} {student?.last_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Email</p>
                        <p className="font-medium text-sm sm:text-base truncate">{student?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium text-sm sm:text-base truncate">{student?.phone || '—'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Date de naissance</p>
                        <p className="font-medium text-sm sm:text-base">{fmtDate(student?.birth_date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Lieu de naissance</p>
                        <p className="font-medium text-sm sm:text-base truncate">{student?.birth_place || '—'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Nationalité</p>
                        <p className="font-medium text-sm sm:text-base truncate">{student?.nationality || '—'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3 sm:col-span-2">
                      <Home className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Adresse</p>
                        <p className="font-medium text-sm sm:text-base">{student?.address || '—'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 sm:gap-3 sm:col-span-2">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Ville / Pays</p>
                        <p className="font-medium text-sm sm:text-base">{student?.city || '—'} {student?.country && `/ ${student.country}`}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Program Information */}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    Programme demandé
                  </h2>
                  
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="sm:col-span-2">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Programme</p>
                        <p className="font-medium text-base sm:text-lg">{level?.title || level?.title_ar || '—'}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Code</p>
                        <p className="font-medium text-base sm:text-lg">{level?.code || '—'}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Durée</p>
                        <p className="font-medium text-base sm:text-lg">{level?.duration || '—'}</p>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Faculté / Département</p>
                        <p className="font-medium text-sm sm:text-base">{level?.faculty?.name || '—'} {level?.department?.name && `/ ${level.department.name}`}</p>
                      </div>
                    </div>
                    
                    {level?.description && (
                      <div className="mt-3 sm:mt-4">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Description</p>
                        <p className="font-medium text-sm sm:text-base">{level.description}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Enrollment Information */}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    Informations sur la candidature
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Date de création</p>
                      <p className="font-medium text-sm sm:text-base">{fmtDateTime(enrollment.created_at)}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Dernière mise à jour</p>
                      <p className="font-medium text-sm sm:text-base">{fmtDateTime(enrollment.updated_at)}</p>
                    </div>
                    
                    {enrollment.enrolled_at && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Date d'inscription</p>
                        <p className="font-medium text-sm sm:text-base">{fmtDate(enrollment.enrolled_at)}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Statut actuel</p>
                      <div className={`inline-flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${statusConfig.className}`}>
                        {statusConfig.icon}
                        <span className="hidden xs:inline">{statusConfig.label}</span>
                        <span className="xs:hidden">{statusConfig.label.split(' ')[0]}</span>
                      </div>
                    </div>
                    
                    {enrollment.payment_status && (
                      <div className="sm:col-span-2">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Statut de paiement</p>
                        <div className={`inline-flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${paymentConfig.className}`}>
                          {paymentConfig.icon}
                          <span className="hidden sm:inline">{paymentConfig.label}</span>
                          <span className="sm:hidden">{paymentConfig.label.split(' ')[0]}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Notes */}
                  {(enrollment.notes || enrollment.rejection_reason) && (
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Notes</p>
                      <p className="font-medium text-sm sm:text-base">{enrollment.notes || enrollment.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    Documents soumis
                  </h2>
                  
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 sm:flex sm:justify-between">
                    <div className="text-center p-2 sm:p-0">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{verifiedDocuments}</p>
                      <p className="text-xs sm:text-sm text-gray-500">Vérifiés</p>
                    </div>
                    
                    <div className="text-center p-2 sm:p-0">
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalDocuments}</p>
                      <p className="text-xs sm:text-sm text-gray-500">Total</p>
                    </div>
                    
                    <div className="text-center p-2 sm:p-0">
                      <p className="text-xl sm:text-2xl font-bold text-amber-600">{requiredVerifiedDocuments}/{requiredDocuments}</p>
                      <p className="text-xs sm:text-sm text-gray-500">Obligatoires</p>
                    </div>
                  </div>
                </div>
                
                {documents.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-gray-500">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                    <p className="text-sm sm:text-base">Aucun document n'a été soumis avec cette candidature.</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={`p-1.5 sm:p-2 rounded-full ${doc.verified ? 'bg-green-100' : 'bg-gray-100'} flex-shrink-0`}>
                              {doc.verified ? (
                                <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                              ) : (
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                              )}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-sm sm:text-base truncate">{doc.name}</h3>
                              <p className="text-xs sm:text-sm text-gray-500">{getDocumentTypeName(doc.type)}</p>
                              
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                                {doc.required && (
                                  <span className="text-xs px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-700 rounded-full">
                                    Obligatoire
                                  </span>
                                )}
                                
                                <span className="text-xs px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded-full">
                                  Ajouté le {fmtDate(doc.uploaded_at)}
                                </span>
                                
                                {doc.verified && (
                                  <span className="text-xs px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 rounded-full">
                                    Vérifié le {fmtDate(doc.verified_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            {doc.url && (
                              <a 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:py-2 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm hover:bg-blue-200 transition-colors"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                Voir
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {doc.rejection_reason && (
                          <div className="mt-3 p-2 sm:p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                            <p className="text-xs sm:text-sm text-red-700">
                              <span className="font-medium">Raison du rejet:</span> {doc.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  Historique de la candidature
                </h2>
                
                {history.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-gray-500">
                    <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                    <p className="text-sm sm:text-base">Aucun historique disponible pour cette candidature.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    <div className="space-y-4 sm:space-y-6">
                      {history.map((item, index) => {
                        const statusConfig = getHistoryStatusConfig(item.status);
                        
                        return (
                          <div key={item.id} className="relative flex items-start gap-3 sm:gap-4">
                            {/* Timeline dot */}
                            <div className={`relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${statusConfig.className} flex-shrink-0`}>
                              {statusConfig.icon}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 pb-4 sm:pb-6 min-w-0">
                              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                <div className="flex flex-col gap-1 sm:gap-2 mb-2">
                                  <h3 className="font-medium text-sm sm:text-base">{statusConfig.label}</h3>
                                  <p className="text-xs sm:text-sm text-gray-500">{fmtDateTime(item.created_at)}</p>
                                </div>
                                
                                {item.user && (
                                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                    Par {item.user.name}
                                  </p>
                                )}
                                
                                {item.notes && (
                                  <p className="text-xs sm:text-sm text-gray-700 bg-white p-2 sm:p-3 rounded border-l-4 border-blue-500">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-500 print:hidden">
          <p>Cette candidature a été soumise via la plateforme d'inscription en ligne.</p>
          <p>Pour toute question, veuillez contacter le service des admissions.</p>
        </div>
      </div>
    </div>
  );
}