<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Créer les rôles s'ils n'existent pas
        $roles = ['admin', 'instructor', 'student'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@usk.test'],
            [
                'first_name' => 'Super',
                'last_name'  => 'Admin',
                'password'   => Hash::make('password'),
            ]
        );
        $admin->assignRole('admin');

        // Instructor
        $instructor = User::firstOrCreate(
            ['email' => 'instructor@usk.test'],
            [
                'first_name' => 'Prof',
                'last_name'  => 'Smith',
                'password'   => Hash::make('password'),
            ]
        );
        $instructor->assignRole('instructor');

        // Student
        $student = User::firstOrCreate(
            ['email' => 'student@usk.test'],
            [
                'first_name' => 'Juan',
                'last_name'  => 'Etudiant',
                'password'   => Hash::make('password'),
            ]
        );
        $student->assignRole('student');
    }
}
