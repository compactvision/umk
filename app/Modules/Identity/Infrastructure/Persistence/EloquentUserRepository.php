<?php

namespace App\Modules\Identity\Infrastructure\Persistence;

use App\Models\User as UserModel;
use App\Modules\Identity\Domain\Entities\User;
use App\Modules\Identity\Domain\Repositories\UserRepository;

final class EloquentUserRepository implements UserRepository
{
    public function save(User $user): User
    {
        $model = $user->id()
            ? UserModel::findOrFail($user->id())
            : new UserModel();

        $model->last_name  = $user->lastName();
        $model->first_name = $user->firstName();
        $model->post_name  = $user->postName();
        $model->gender     = $user->gender();
        $model->email      = $user->email();
        $model->password   = $user->password();
        $model->email_verified_at = $user->isVerified() ? now() : null;
        $model->save();

        return $this->mapToEntity($model);
    }

    public function findById(int $id): ?User
    {
        $model = UserModel::find($id);
        return $model ? $this->mapToEntity($model) : null;
    }

    public function findByEmail(string $email): ?User
    {
        $model = UserModel::where('email', $email)->first();
        return $model ? $this->mapToEntity($model) : null;
    }

    private function mapToEntity(UserModel $model): User
    {
        return new User(
            $model->id,
            $model->last_name,
            $model->first_name,
            $model->post_name,
            $model->gender,
            $model->email,
            $model->password,
            $model->email_verified_at ? new \DateTimeImmutable($model->email_verified_at) : null
        );
    }
}
