import Alert from "@/utils/sweetAlert";
import { useForm } from "@inertiajs/react";
import ErrorText from "../UI/ErrorText";

export default function CreateFacultyPopup({
  isEdit,
  closeModal,
  faculty,
}: {
  isEdit: boolean;
  closeModal: () => void;
  faculty: any;
}) {
  const { data, setData, errors, post, put, processing, reset } = useForm({
    id: faculty?.id ?? "",
    name: faculty?.name ?? "",
    code: faculty?.code ?? "",
    description: faculty?.description ?? "",
    duration_years: faculty?.duration_years ?? "",
    is_active: faculty?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      Alert.loading("Mise à jour en cours...");
      put(route("dashboard.admin.faculties.update", data.id), {
        onSuccess: () => {
          Alert.success("Faculté mise à jour avec succès!");
          closeModal();
        },
        onError: (error) => {
          Alert.error(error?.message || "Une erreur s'est produite");
        },
        onFinish: () => Alert.close(),
      });
      reset();
    } else {
      Alert.loading("Création en cours...");
      post(route("dashboard.admin.faculties.store"), {
        onSuccess: () => {
          Alert.success("Faculté créée avec succès!");
          reset();
          closeModal();
        },
        onError: (error) => {
          Alert.error(error?.message || "Une erreur s'est produite");
        },
        onFinish: () => Alert.close(),
      });
      reset();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.currentTarget === e.target) closeModal();
      }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {isEdit ? data.name || "Modifier la faculté" : "🏛️ Nouvelle Faculté"}
            </h2>
            <p className="text-gray-600">
              {isEdit
                ? "Modifiez les informations de la faculté"
                : "Remplissez les informations de la faculté"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Fermer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Erreurs globales */}
        {errors?.duplicate && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium">{errors.duplicate as string}</p>
          </div>
        )}
        {errors?.general && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium">{errors.general as string}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
              Nom de la faculté
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ex: Faculté de Médecine"
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
              required
              className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name
                  ? "border-red-500 bg-red-50 focus:ring-red-400"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />
            <ErrorText error={errors.name as string} />
          </div>

          {/* Code */}
          <div>
            <label htmlFor="code" className="mb-2 block text-sm font-medium text-gray-700">
              Code de la faculté
            </label>
            <input
              type="text"
              id="code"
              name="code"
              placeholder="Ex: MED"
              value={data.code}
              onChange={(e) => setData("code", e.target.value.toUpperCase())}
              maxLength={10}
              required
              className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.code
                  ? "border-red-500 bg-red-50 focus:ring-red-400"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />
            <ErrorText error={errors.code as string} />
          </div>

          {/* Durée */}
          <div>
            <label htmlFor="duration_years" className="mb-2 block text-sm font-medium text-gray-700">
              Durée de la faculté (en années)
            </label>
            <input
              type="number"
              id="duration_years"
              name="duration_years"
              placeholder="4"
              min={1}
              max={10}
              value={data.duration_years}
              onChange={(e) =>
                setData("duration_years", e.target.value === "" ? "" : Number(e.target.value))
              }
              required
              className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.duration_years
                  ? "border-red-500 bg-red-50 focus:ring-red-400"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />
            <ErrorText error={errors.duration_years as string} />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Courte présentation de la faculté"
              rows={7}
              value={data.description}
              onChange={(e) => setData("description", e.target.value)}
              className={`w-full resize-none rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description
                  ? "border-red-500 bg-red-50 focus:ring-red-400"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />
            <ErrorText error={errors.description as string} />
          </div>

          {/* Statut (switch) */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Statut</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={!!data.is_active}
                onChange={(e) => setData("is_active", e.target.checked)}
              />
              <div className="relative h-6 w-12 rounded-full bg-gray-200 transition peer-checked:bg-blue-600">
                <div className="absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition peer-checked:translate-x-6" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {data.is_active ? "Active" : "Inactive"}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={processing}
              className="h-11 rounded-lg bg-gray-100 px-6 font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 font-medium text-white transition hover:from-blue-600 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>{isEdit ? "Mise à jour..." : "Création..."}</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{isEdit ? "Mettre à jour la faculté" : "Créer la faculté"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
