import { AlertCircle, Building2, Calendar, GraduationCap } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { Faculty, FormData, Level, Year } from '../../types';
type Props = {
    faculties: Faculty[];
    years: Year[];
    availableLevels: Level[];
    availablePrograms?: { id: number; name: string; code: string }[];
    noLevelsForSelectedFaculty: boolean;
    formData: FormData;
    setFormData: Dispatch<SetStateAction<FormData>>;
    errors: Record<string, string>;
    setErrors: Dispatch<SetStateAction<Record<string, string>>>;
};
export default function Step1Faculty({
    faculties,
    years,
    availableLevels,
    availablePrograms = [],
    noLevelsForSelectedFaculty,
    formData,
    setFormData,
    errors,
    setErrors,
}: Props) {
    return (
        <div className="enrollment-fields">
            {[
                {
                    key: 'faculty_id' as const,
                    label: 'Votre faculté',
                    icon: Building2,
                    options: faculties,
                    placeholder: 'Sélectionnez une faculté',
                    help: 'Choisissez le domaine dans lequel vous souhaitez étudier.',
                    disabled: false,
                },
                {
                    key: 'level_id' as const,
                    label: 'Niveau académique',
                    icon: GraduationCap,
                    options: availableLevels,
                    placeholder: !formData.faculty_id ? 'Choisissez d’abord votre faculté' : 'Sélectionnez un niveau',
                    help: 'Les niveaux proposés dépendent de la faculté choisie.',
                    disabled: !formData.faculty_id || noLevelsForSelectedFaculty,
                },
                {
                    key: 'year_id' as const,
                    label: 'Année académique',
                    icon: Calendar,
                    options: years,
                    placeholder: 'Sélectionnez une année',
                    help: 'Seules les années ouvertes aux inscriptions sont proposées.',
                    disabled: false,
                },
            ].map(({ key, label, icon: Icon, options, placeholder, help, disabled }) => (
                <div key={key} className="enrollment-field">
                    <label htmlFor={key}>
                        <Icon size={17} />
                        {label}
                        <span className="enrollment-required">*</span>
                    </label>
                    <select
                        id={key}
                        value={formData[key]}
                        disabled={disabled}
                        required
                        aria-invalid={!!errors[key]}
                        aria-describedby={`${key}-help${errors[key] ? ` ${key}-error` : ''}`}
                        onChange={(e) => {
                            setFormData((prev) => ({ ...prev, [key]: e.target.value, ...(key === 'faculty_id' ? { level_id: '', academic_program_id: '' } : key === 'level_id' ? { academic_program_id: '' } : {}) }));
                            setErrors((prev) => ({ ...prev, [key]: '' }));
                        }}
                    >
                        <option value="">{placeholder}</option>
                        {options.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                    <p id={`${key}-help`} className="enrollment-field-help">
                        {help}
                    </p>
                    {errors[key] && (
                        <p id={`${key}-error`} className="enrollment-field-error" role="alert">
                            {errors[key]}
                        </p>
                    )}
                </div>
            ))}
            {availablePrograms.length === 1 && <p className="enrollment-info">Programme officiel : {availablePrograms[0].name} ({availablePrograms[0].code}).</p>}
            {availablePrograms.length > 1 && <div className="enrollment-field"><label htmlFor="academic_program_id">Programme officiel <span className="enrollment-required">*</span></label><select id="academic_program_id" required value={formData.academic_program_id ?? ''} aria-invalid={!!errors.academic_program_id} onChange={event => setFormData(previous => ({ ...previous, academic_program_id: event.target.value }))}><option value="">Choisissez le programme correspondant à votre candidature</option>{availablePrograms.map(program => <option key={program.id} value={program.id}>{program.code} · {program.name}</option>)}</select>{errors.academic_program_id && <p role="alert" className="enrollment-field-error">{errors.academic_program_id}</p>}</div>}
            {(noLevelsForSelectedFaculty || !years.length || !faculties.length) && (
                <p className="enrollment-info">
                    <AlertCircle size={19} />
                    {!faculties.length
                        ? 'Aucune faculté n’est disponible pour le moment.'
                        : !years.length
                          ? 'Aucune année académique n’est ouverte pour le moment.'
                          : 'Aucun niveau n’est proposé pour cette faculté.'}{' '}
                    Contactez le service des inscriptions pour être accompagné.
                </p>
            )}
        </div>
    );
}
