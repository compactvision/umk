<?php

namespace App\Modules\Identity\Infrastructure\Persistence;

use App\Models\User as EloquentUser;
use App\Modules\Identity\Domain\Entities\User;
use App\Modules\Identity\Domain\Repositories\UserRepository;

final class EloquentUserRepository implements UserRepository
{
    public function save(User $user): User
    {
        $model = $user->id()
            ? EloquentUser::findOrFail($user->id())
            : new EloquentUser();

        $model->fill([
            'last_name' => $user->lastName(),
            'first_name' => $user->firstName(),
            'post_name' => $user->postName(),
            'gender' => $user->gender(),
            'email' => $user->email(),
            'password' => $user->passwordHash(),
            'email_verified_at' => $user->isVerified() ? now() : null,
            'role' => $user->role(),
        ]);
        $model->save();

        if (!$user->id()) {
            $model->assignRole('user');
        }

        return $this->mapToEntity($model);
    }

    public function findByEmail(string $email): ?User
    {
        $model = EloquentUser::where('email', $email)->first();
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findById(int $id): ?User
    {
        $model = EloquentUser::find($id);
        return $model ? $this->mapToEntity($model) : null;
    }

    private function mapToEntity(EloquentUser $model): User
    {
        return new User(
            $model->id,
            $model->last_name,
            $model->first_name,
            $model->post_name,
            $model->gender,
            $model->email,
            $model->password,
            $model->email_verified_at ? new \DateTimeImmutable($model->email_verified_at) : null,
            $model->role ?? 'user'
        );
    }
}
