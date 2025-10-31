import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {route} from 'ziggy-js';
import LevelPopup from '@/components/form/LevelPopup';
import Dashboard from '@/components/layouts/Dashboard/Dashboard';
import CreateFacultyPopup from '@/components/form/CreateFacultyPopup';
import Alert from '@/utils/sweetAlert';

const Faculty = () => {
  const { faculties = { data: [] }, levelCodes = { data: [] } } = usePage().props as {
    faculties: { data: any[] };
    levelCodes: { data: any[] };
  };

  // Données fictives si rien ne vient du backend
  const fakeLevelCodes = [
    { id: 1, code: 'L1', name: 'Licence 1' },
    { id: 2, code: 'L2', name: 'Licence 2' },
    { id: 3, code: 'L3', name: 'Licence 3' },
  ];

  const codesToUse = levelCodes?.data?.length ? levelCodes.data : fakeLevelCodes;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [levelEdit, setLevelEdit] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<any | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);

  const openEditModal = (faculty: any) => {
    setIsEdit(true);
    setIsModalOpen(true);
    setSelectedFaculty(faculty);
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEdit(false);
    setLevelEdit(false);
    setSelectedFaculty(null);
    setSelectedLevel(null);
  };

  const deleteFaculty = async (id: number) => {
    const confirmed = await Alert.deleteConfirm('cette faculté');
    if (!confirmed) return;

    Alert.loading('Suppression en cours...');
    router.delete(route('dashboard.admin.faculties.destroy', id), {
      onSuccess: () => {
        Alert.success('Faculté supprimée avec succès.');
      },
      onError: () => {
        Alert.error('Une erreur est survenue.');
      },
      onFinish: () => {
        Alert.close();
      },
    });
  };

  const viewLevel = (level: any) => {
    router.visit(route('dashboard.admin.levels.show', level.id));
  };

  const editLevel = (level: any) => {
    setLevelEdit(true);
    setSelectedLevel(level);
  };

  const deleteLevel = async (levelId: number) => {
    const confirmed = await Alert.deleteConfirm('ce niveau');
    if (!confirmed) return;

    Alert.loading('Suppression en cours...');
    router.delete(route('dashboard.admin.levels.destroy', levelId), {
      onSuccess: () => {
        Alert.success('Niveau supprimé avec succès.');
        closeModal();
      },
      onError: () => {
        Alert.error('Une erreur est survenue.');
        closeModal();
      },
      onFinish: () => {
        Alert.close();
      },
    });
  };

  return (
    <Dashboard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">🎓 Gestion des Facultés</h1>
            <p className="text-base md:text-lg text-gray-600">
              Créez et gérez les facultés avec leurs niveaux d&apos;études
            </p>
          </div>

          {/* Create Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg shadow-lg shadow-blue-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/40 flex items-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="animate-pulse"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="16"
                  strokeDashoffset="16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <path d="M5 12h14">
                    <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="16;0" />
                  </path>
                  <path d="M12 5v14">
                    <animate
                      fill="freeze"
                      attributeName="stroke-dashoffset"
                      begin="0.4s"
                      dur="0.4s"
                      values="16;0"
                    />
                  </path>
                </g>
              </svg>
              <span>Créer une nouvelle faculté</span>
            </button>
          </div>

          {/* Faculties Grid - Container with overflow handling */}
          <div className="relative pb-24 md:pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!faculties?.data || faculties.data.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl shadow-md p-12 text-center">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune faculté créée</h3>
                  <p className="text-gray-500">
                    Cliquez sur &quot;Créer une nouvelle faculté&quot; pour commencer
                  </p>
                </div>
              ) : (
                faculties.data.map((faculty: any) => {
                  const levels = faculty.levels || [];
                  return (
                    <div
                      className="relative"
                      key={faculty.id}
                      onMouseEnter={() => setHoveredCard(faculty.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div
                        className={`bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-transparent hover:border-blue-500 ${
                          hoveredCard === faculty.id ? 'z-50' : 'z-10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <Link
                              href={route('dashboard.admin.faculties.show', faculty.id)}
                              className="text-lg md:text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200"
                            >
                              {faculty.name}
                            </Link>
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold mt-2 inline-block">
                              {faculty.code}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(faculty)}
                              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteFaculty(faculty.id)}
                              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-600 mb-2 text-sm md:text-base">{faculty.description}</p>
                          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium inline-block">
                            Durée: {faculty.duration_years} ans
                          </div>
                        </div>

                        {/* Levels Submenu - Improved positioning and z-index */}
                        <div
                          className={`absolute top-full left-0 right-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-b-2xl overflow-hidden transition-all duration-500 ${
                            hoveredCard === faculty.id
                              ? 'opacity-100 translate-y-0 z-[9999]'
                              : 'opacity-0 -translate-y-4 pointer-events-none z-[9999]'
                          }`}
                        >
                          <div className="p-4 max-h-80 overflow-y-auto">
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/20">
                              <div className="flex items-center gap-2 text-white">
                                <span className="text-xl animate-bounce">📚</span>
                                <span className="font-semibold">Niveaux d&apos;études</span>
                              </div>
                              <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                                {levels.length} niveau{levels.length > 1 ? 'x' : ''}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {levels.length === 0 ? (
                                <div className="text-center text-white/70 italic">Aucun niveau configuré</div>
                              ) : (
                                levels.map((level: any, index: number) => (
                                  <div
                                    key={level.id}
                                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 flex justify-between items-center"
                                  >
                                    <div className="flex-1">
                                      <div className="text-white font-semibold text-sm mb-1">
                                        {level.level_name}
                                      </div>
                                      <div className="bg-white/20 text-white px-2 py-1 rounded text-xs inline-block mb-1">
                                        {level.level_code}
                                      </div>
                                      <div className="text-white/80 text-sm flex items-center gap-1">
                                        <span className="text-sm">👥</span>
                                        {level.student_number} étudiants
                                      </div>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => editLevel(level)}
                                        className="bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-all duration-200"
                                        title="Modifier"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => viewLevel(level)}
                                        className="bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-all duration-200"
                                        title="Voir"
                                      >
                                        👁️
                                      </button>
                                      <button
                                        onClick={() => deleteLevel(level.id)}
                                        className="bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-all duration-200"
                                        title="Supprimer"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
                <CreateFacultyPopup isEdit={isEdit} closeModal={closeModal} faculty={selectedFaculty} />
              </div>
            </div>
          )}

          {/* Level Edit Modal */}
          {levelEdit && (
            <LevelPopup
                  faculties={faculties}
                  onClose={closeModal}
                  level={selectedLevel}
                  levelCodes={codesToUse}
                />
          )}
        </div>
      </div>
    </Dashboard>
  );
};

export default Faculty;