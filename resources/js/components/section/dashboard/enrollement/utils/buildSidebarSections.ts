// resources/js/pages/enrollment/utils/buildSidebarSections.ts
import { BookOpen, Building2, Calendar, CheckCircle2, CreditCard, FileText, GraduationCap, Lock, Mail, User } from 'lucide-react';
import { PaymentStage, Requirements, Section, SectionField } from '../types';

export function buildSidebarSections(requirements: Requirements, paymentStage: PaymentStage): Section[] {
    const personalDocFields: SectionField[] = (requirements.personal_info ?? []).map((d) => ({
        key: d.key,
        label: d.label ?? d.key,
        icon: FileText,
        type: 'doc',
    }));

    const academicDocFields: SectionField[] = (requirements.academic_info ?? []).map((d) => ({
        key: d.key,
        label: d.label ?? d.key,
        icon: FileText,
        type: 'doc',
    }));

    const paymentFields: SectionField[] = [
        { key: 'confirmed', label: 'Certification', icon: CheckCircle2, type: 'confirm' },
        ...(paymentStage === 'pay' && requirements.payment
            ? [
                  { key: 'cardNumber', label: 'Numéro de carte', icon: CreditCard, type: 'payment' },
                  { key: 'cvv', label: 'Code CVV', icon: Lock, type: 'payment' },
              ]
            : []),
    ];

    return [
        {
            title: 'Choix de la Faculté',
            icon: Building2,
            fields: [
                { key: 'faculty_id', label: 'Faculté', icon: Building2 },
                { key: 'level_id', label: 'Niveau académique', icon: GraduationCap },
                { key: 'year_id', label: "Année d'inscription", icon: Calendar },
            ],
        },
        {
            title: 'Informations Personnelles',
            icon: User,
            fields: [{ key: 'name', label: 'Nom complet', icon: User }, { key: 'email', label: 'Adresse email', icon: Mail }, ...personalDocFields],
        },
        {
            title: 'Parcours Académique',
            icon: BookOpen,
            fields: [{ key: 'program', label: "Programme d'études", icon: BookOpen }, ...academicDocFields],
        },
        {
            title: 'Paiement & Confirmation',
            icon: CreditCard,
            fields: paymentFields,
        },
    ];
}
