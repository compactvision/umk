// resources/js/pages/enrollment/components/steps/Step4Payment.tsx
import { AlertCircle, Check, CreditCard, Lock, Shield } from 'lucide-react';
import { Requirements } from '../../types';

type Props = {
    isConfirmed: boolean;
    setIsConfirmed: (checked: boolean) => void;
    errors: Record<string, string>;
    requirements: Requirements;
    paymentStage: 'confirm' | 'pay';
    formData: any;
    setCardNumber: (raw: string) => void;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    focusedField: string | null;
    setFocusedField: (v: string | null) => void;
};

export default function Step4Payment({
    isConfirmed,
    setIsConfirmed,
    errors,
    requirements,
    paymentStage,
    formData,
    setCardNumber,
    setFormData,
    focusedField,
    setFocusedField,
}: Props) {
    return (
        <div className="animate-fadeIn space-y-6">
            {/* Confirmation */}
            <div
                className={`rounded-2xl border-2 ${errors.confirmed ? 'border-red-300 bg-red-50' : 'border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50'} p-6 transition-all duration-300`}
            >
                <label className="group flex cursor-pointer items-start gap-3">
                    <div className="relative mt-1 flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={isConfirmed}
                            onChange={(e) => setIsConfirmed(e.target.checked)}
                            className="h-6 w-6 cursor-pointer rounded-lg border-2 border-indigo-300 transition-all duration-300 checked:border-indigo-600 checked:bg-indigo-600"
                        />
                        {isConfirmed && <Check className="pointer-events-none absolute h-4 w-4 text-white" />}
                    </div>
                    <div>
                        <span className="block text-sm font-semibold text-gray-800 transition-colors group-hover:text-indigo-600">
                            Je certifie l'exactitude des informations
                        </span>
                        <span className="mt-1 block text-xs text-gray-600">
                            En cochant cette case, vous confirmez que toutes les informations fournies sont vraies et complètes.
                        </span>
                    </div>
                </label>
                {errors.confirmed && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {errors.confirmed}
                    </div>
                )}
            </div>

            {/* Paiement */}
            {paymentStage === 'pay' && requirements.payment && (
                <div className="space-y-6">
                    <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="mr-3 rounded-full bg-green-100 p-2">
                                    <CreditCard className="h-5 w-5 text-green-600" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">Montant à régler</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">
                                {requirements.payment.amount} {requirements.payment.currency}
                            </span>
                        </div>
                    </div>

                    {/* Numéro de carte */}
                    <div className={`group ${focusedField === 'cardNumber' ? 'scale-105 transform' : ''} transition-all duration-300`}>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            <CreditCard className="mr-2 inline h-4 w-4 text-indigo-600" />
                            Numéro de carte
                        </label>
                        <input
                            type="text"
                            className={`w-full rounded-xl border-2 ${errors.cardNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} px-4 py-3 transition-all duration-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100`}
                            placeholder="1234 5678 9012 3456"
                            value={formData.cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            onFocus={() => setFocusedField('cardNumber')}
                            onBlur={() => setFocusedField(null)}
                            maxLength={19}
                        />
                        {errors.cardNumber && (
                            <div className="mt-1 flex items-center text-sm text-red-600">
                                <AlertCircle className="mr-1 h-4 w-4" />
                                {errors.cardNumber}
                            </div>
                        )}
                    </div>

                    {/* CVV */}
                    <div className={`group ${focusedField === 'cvv' ? 'scale-105 transform' : ''} transition-all duration-300`}>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            <Lock className="mr-2 inline h-4 w-4 text-purple-600" />
                            Code CVV
                        </label>
                        <input
                            type="text"
                            className={`w-full rounded-xl border-2 ${errors.cvv ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} px-4 py-3 transition-all duration-300 focus:border-purple-600 focus:ring-4 focus:ring-purple-100`}
                            placeholder="123"
                            value={formData.cvv}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setFormData((prev: any) => ({ ...prev, cvv: value }));
                            }}
                            onFocus={() => setFocusedField('cvv')}
                            onBlur={() => setFocusedField(null)}
                            maxLength={3}
                        />
                        {errors.cvv && (
                            <div className="mt-1 flex items-center text-sm text-red-600">
                                <AlertCircle className="mr-1 h-4 w-4" />
                                {errors.cvv}
                            </div>
                        )}
                    </div>

                    <div className="flex items-start rounded-xl bg-blue-50 p-4">
                        <Shield className="mt-0.5 mr-2 h-5 w-5 text-blue-600" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">Paiement sécurisé</p>
                            <p className="mt-1 text-xs text-blue-600">
                                Vos informations de paiement sont cryptées et ne seront jamais stockées sur nos serveurs.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
