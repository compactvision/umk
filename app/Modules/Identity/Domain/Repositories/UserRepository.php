<?php 

namespace App\Modules\Identity\Domain\Repositories;

use App\Modules\Identity\Domain\Entities\User;

interface UserRepository
{
    public function save(User $user): User;
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
}
