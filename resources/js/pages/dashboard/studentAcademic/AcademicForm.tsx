import AdminModal from '@/components/admin/AdminModal';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';
type FormValue = string | number | boolean | null | File | { amount: string; due_at: string }[];
export type Field = {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    options?: { value: string | number; label: string }[];
    help?: string;
    value?: FormValue;
};
export type FormSpec = { title: string; description: string; action: string; fields: Field[]; submitLabel?: string };
export default function AcademicForm({ spec, onClose, onSuccess }: { spec: FormSpec; onClose: () => void; onSuccess: (message: string) => void }) {
    const id = useId();
    const form = useForm<Record<string, FormValue>>(
        Object.fromEntries(
            spec.fields.map((field) => [
                field.name,
                field.value ?? (field.type === 'checkbox' ? false : field.type === 'schedule' ? [] : field.type === 'file' ? null : ''),
            ]),
        ),
    );
    return (
        <AdminModal
            title={spec.title}
            description={spec.description}
            formId={id}
            onClose={onClose}
            submitLabel={spec.submitLabel || 'Enregistrer'}
            busy={form.processing}
            wide
            errors={form.errors}
            className="academic-form-modal"
        >
            <form
                id={id}
                className="academic-admin-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(spec.action, {
                        preserveScroll: true,
                        forceFormData: spec.fields.some((field) => field.type === 'file'),
                        errorBag: `academic-${id.replace(/\W/g, '')}`,
                        onSuccess: (page) => onSuccess(String(page.props.success || 'Modification enregistrée.')),
                    });
                }}
            >
                <fieldset disabled={form.processing}>
                    {spec.fields.map((field) => {
                        const inputId = `${id}-${field.name}`;
                        if (field.type === 'schedule') {
                            const rows = (Array.isArray(form.data[field.name]) ? form.data[field.name] : []) as { amount: string; due_at: string }[];
                            return (
                                <section className="academic-plan" key={field.name}>
                                    <h3>{field.label}</h3>
                                    <p>{field.help}</p>
                                    {rows.map((row, index) => (
                                        <div key={index}>
                                            <label>
                                                Échéance {index + 1}
                                                <input
                                                    type="date"
                                                    required
                                                    value={row.due_at}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            field.name,
                                                            rows.map((value, i) => (i === index ? { ...value, due_at: event.target.value } : value)),
                                                        )
                                                    }
                                                />
                                            </label>
                                            <label>
                                                Montant (USD)
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    required
                                                    value={row.amount}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            field.name,
                                                            rows.map((value, i) => (i === index ? { ...value, amount: event.target.value } : value)),
                                                        )
                                                    }
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                className="academic-icon-button"
                                                aria-label={`Retirer l’échéance ${index + 1}`}
                                                onClick={() =>
                                                    form.setData(
                                                        field.name,
                                                        rows.filter((_, i) => i !== index),
                                                    )
                                                }
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="admin-secondary"
                                        onClick={() => form.setData(field.name, [...rows, { amount: '', due_at: '' }])}
                                    >
                                        <Plus size={15} />
                                        Ajouter une échéance
                                    </button>
                                </section>
                            );
                        }
                        return (
                            <div className={`academic-field ${field.type === 'checkbox' ? 'is-check' : ''}`} key={field.name}>
                                <label htmlFor={inputId}>
                                    {field.type === 'checkbox' && (
                                        <input
                                            id={inputId}
                                            type="checkbox"
                                            checked={Boolean(form.data[field.name])}
                                            onChange={(event) => form.setData(field.name, event.target.checked)}
                                        />
                                    )}
                                    {field.label}
                                    {field.required && <span> *</span>}
                                </label>
                                {field.type === 'select' ? (
                                    <select
                                        id={inputId}
                                        value={String(form.data[field.name] ?? '')}
                                        required={field.required}
                                        onChange={(event) => form.setData(field.name, event.target.value)}
                                    >
                                        <option value="">Sélectionner…</option>
                                        {field.options?.map((option) => (
                                            <option value={option.value} key={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        id={inputId}
                                        rows={4}
                                        value={String(form.data[field.name] ?? '')}
                                        required={field.required}
                                        onChange={(event) => form.setData(field.name, event.target.value)}
                                    />
                                ) : field.type === 'file' ? (
                                    <input id={inputId} type="file" onChange={(event) => form.setData(field.name, event.target.files?.[0] || null)} />
                                ) : (
                                    field.type !== 'checkbox' && (
                                        <input
                                            id={inputId}
                                            type={field.type || 'text'}
                                            value={String(form.data[field.name] ?? '')}
                                            required={field.required}
                                            step={field.type === 'number' ? '0.01' : undefined}
                                            onChange={(event) => form.setData(field.name, event.target.value)}
                                        />
                                    )
                                )}
                                {field.help && <small>{field.help}</small>}
                                {form.errors[field.name] && <p role="alert">{form.errors[field.name]}</p>}
                            </div>
                        );
                    })}
                </fieldset>
            </form>
        </AdminModal>
    );
}
