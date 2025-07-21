<?php

namespace App\Policies;

use App\Models\Faculty;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FacultyPolicy
{
    use HandlesAuthorization;

    /**
     * Détermine si l'utilisateur peut voir toutes les facultés
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('faculties.view') ||
            $user->hasRole(['admin', 'manager']);
    }

    /**
     * Détermine si l'utilisateur peut voir une faculté
     */
    public function view(User $user, Faculty $faculty): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Détermine si l'utilisateur peut créer des facultés
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('faculties.create') ||
            $user->hasRole(['admin', 'manager']);
    }

    /**
     * Détermine si l'utilisateur peut mettre à jour une faculté
     */
    public function update(User $user, Faculty $faculty): bool
    {
        return $user->hasPermissionTo('faculties.update') ||
            $user->hasRole(['admin', 'manager']);
    }

    /**
     * Détermine si l'utilisateur peut supprimer une faculté
     */
    public function delete(User $user, Faculty $faculty): bool
    {
        // Seuls les admins peuvent supprimer
        if (!$user->hasRole('admin')) {
            return false;
        }

        // Ne peut pas supprimer si la faculté est active et a des étudiants
        if ($faculty->is_active && $faculty->students()->exists()) {
            return false;
        }

        return true;
    }

    /**
     * Détermine si l'utilisateur peut restaurer une faculté
     */
    public function restore(User $user, Faculty $faculty): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Détermine si l'utilisateur peut forcer la suppression
     */
    public function forceDelete(User $user, Faculty $faculty): bool
    {
        return false; // Jamais autorisé pour préserver l'intégrité
    }
}
