// resources/js/pages/enrollment/components/steps/Step1Faculty.tsx
import { AlertCircle, Building2, Calendar, GraduationCap } from 'lucide-react';
import { Faculty, Level, Year } from '../../types';

export default function Step1Faculty({
    faculties,
    years,
    availableLevels,
    noLevelsForSelectedFaculty,
    formData,
    setFormData,
    errors,
    setErrors,
    setFocusedField,
    focusedField,
}: any) {
    return (
        <div className="animate-fadeIn space-y-6">
            {/* Faculté */}
            <div className={`group ${focusedField === 'faculty_id' ? 'scale-105 transform' : ''} transition-all duration-300`}>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                    <Building2 className="mr-2 inline h-4 w-4 text-indigo-600" /> Faculté
                </label>
                <select
                    className={`w-full rounded-xl border-2 ${errors.faculty_id ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} px-4 py-3`}
                    value={formData.faculty_id}
                    onChange={(e) => {
                        setFormData({ ...formData, faculty_id: e.target.value, level_id: '', year_id: '' });
                        setErrors((prev: any) => ({ ...prev, faculty_id: '' }));
                    }}
                    onFocus={() => setFocusedField('faculty_id')}
                    onBlur={() => setFocusedField(null)}
                >
                    <option value="">Sélectionnez une faculté</option>
                    {faculties.map((f: Faculty) => (
                        <option key={f.id} value={f.id}>
                            {f.name}
                        </option>
                    ))}
                </select>
                {errors.faculty_id && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {errors.faculty_id}
                    </div>
                )}
            </div>

            {/* Niveau */}
            <div className={`group ${focusedField === 'level_id' ? 'scale-105 transform' : ''} transition-all duration-300`}>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                    <GraduationCap className="mr-2 inline h-4 w-4 text-purple-600" /> Niveau académique
                </label>
                <select
                    className={`w-full rounded-xl border-2 ${errors.level_id ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} px-4 py-3 disabled:opacity-60`}
                    value={formData.level_id}
                    onChange={(e) => {
                        setFormData({ ...formData, level_id: e.target.value });
                        setErrors((prev: any) => ({ ...prev, level_id: '' }));
                    }}
                    onFocus={() => setFocusedField('level_id')}
                    onBlur={() => setFocusedField(null)}
                    disabled={!formData.faculty_id || noLevelsForSelectedFaculty}
                >
                    <option value="">
                        {!formData.faculty_id
                            ? "Choisissez d'abord une faculté"
                            : noLevelsForSelectedFaculty
                              ? 'Aucun niveau disponible'
                              : 'Sélectionnez un niveau'}
                    </option>
                    {!noLevelsForSelectedFaculty &&
                        availableLevels.map((l: Level) => (
                            <option key={l.id} value={l.id}>
                                {l.name}
                            </option>
                        ))}
                </select>
                {noLevelsForSelectedFaculty && (
                    <div className="mt-2 flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Aucun niveau n'est défini pour cette faculté pour le moment.
                    </div>
                )}
                {errors.level_id && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {errors.level_id}
                    </div>
                )}
            </div>

            {/* Année */}
            <div className={`group ${focusedField === 'year_id' ? 'scale-105 transform' : ''} transition-all duration-300`}>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                    <Calendar className="mr-2 inline h-4 w-4 text-pink-600" /> Année d'inscription
                </label>
                <select
                    className={`w-full rounded-xl border-2 ${errors.year_id ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} px-4 py-3`}
                    value={formData.year_id}
                    onChange={(e) => {
                        setFormData({ ...formData, year_id: e.target.value });
                        setErrors((prev: any) => ({ ...prev, year_id: '' }));
                    }}
                    onFocus={() => setFocusedField('year_id')}
                    onBlur={() => setFocusedField(null)}
                >
                    <option value="">Sélectionnez une année</option>
                    {years.map((y: Year) => (
                        <option key={y.id} value={y.id}>
                            {y.name}
                        </option>
                    ))}
                </select>
                {errors.year_id && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {errors.year_id}
                    </div>
                )}
            </div>
        </div>
    );
}
