import React, { useState } from 'react';
import './PopupNiveau.css'; // CSS externalisé selon BEM

export default function PopupNiveau() {
    const [form, setForm] = useState({
        name: '',
        code: '',
        duration: '1',
        description: '',
        students: '',
        image: null,
        imagePreview: null,
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setForm({ ...form, [id]: value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setForm((prev) => ({ ...prev, image: file, imagePreview: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const saveLevel = () => {
        if (!form.name || !form.code) {
            alert('Veuillez remplir les champs obligatoires.');
            return;
        }

        const payload = {
            ...form,
            createdAt: new Date().toISOString(),
        };

        console.log('Niveau enregistré :', payload);
        alert(`✅ Niveau "${form.name}" enregistré avec succès !`);
    };

    return (
        <div className="popup-overlay">
            <div className="popup__container">
                <div className="popup__header">
                    <h2 className="popup__title">🎓 Ajouter un Niveau</h2>
                    <button className="popup__close" onClick={() => alert('Fermeture')}>×</button>
                </div>
                <div className="popup__content">
                    <div className="popup__sidebar">
                        <div className="form__group">
                            <label htmlFor="duration">Faculté</label>
                            <select id="duration" value={form.duration} onChange={handleChange}>
                                {["Medecine", "Info", "Droit"].map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div className="form__group">
                            <label htmlFor="name">Nom du niveau</label>
                            <input id="name" type="text" placeholder="Ex : L1, M2..." value={form.name} onChange={handleChange} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="code">Code</label>
                            <input id="code" type="text" placeholder="Ex : L1" value={form.code} onChange={handleChange} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="duration">Durée (en années)</label>
                            <select id="duration" value={form.duration} onChange={handleChange}>
                                {[1,2,3,4].map((y) => <option key={y} value={y}>{y} an{y > 1 && 's'}</option>)}
                            </select>
                        </div>

                        <div className="form__group">
                            <label htmlFor="students">Nombre d'étudiants</label>
                            <input id="students" type="number" placeholder="Ex : 250" value={form.students} onChange={handleChange} />
                        </div>

                        <div className="form__group">
                            <label htmlFor="image">Image</label>
                            <input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                            {form.imagePreview && (
                                <img src={form.imagePreview} alt="Aperçu" className="form__preview" />
                            )}
                        </div>
                    </div>

                    <div className="popup__main">
                        <div className="form__group">
                            <label htmlFor="description">Description</label>
                            <textarea id="description" rows="10" placeholder="Décrivez ce niveau..." value={form.description} onChange={handleChange}></textarea>
                        </div>
                        <button className="btn btn--primary" onClick={saveLevel}>💾 Enregistrer</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
