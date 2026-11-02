<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Réinitialiser le cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Permissions
        $permissions = [
            // Dashboard
            'view dashboard',

            // Étudiant
            'view courses',
            'submit assignments',
            'view grades',

            // Candidat
            'apply to programs',
            'view application status',

            // Professeur
            'manage courses',
            'grade assignments',
            'manage students',

            // Admin
            'manage academic access', 'manage academic finance', 'publish academic content',
            'manage users',
            'manage content',
            'configure settings',
            'faculties.create',
            'faculties.update',

            // Super Admin
            'super admin'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Rôles
        $roles = [
            'user' => ['view dashboard'],
            'student' => ['view dashboard', 'view courses', 'submit assignments', 'view grades'],
            'candidate' => ['apply to programs', 'view application status'],
            'professor' => ['view dashboard', 'manage courses', 'grade assignments', 'manage students'],
            'admin' => ['manage academic access', 'manage academic finance', 'publish academic content', 'view dashboard', 'manage users', 'manage content', 'configure settings', 'faculties.create', 'faculties.update'],
            'super admin' => Permission::pluck('name')->toArray()
        ];

        foreach ($roles as $role => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $role]);
            $role->syncPermissions($rolePermissions);
        }
    }
}
