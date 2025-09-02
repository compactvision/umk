<?php
namespace App\Modules\Identity\Application\UseCases;

use App\Modules\Identity\Domain\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

final class ResetPassword
{
    public function __construct(private UserRepository $repo) {}

    public function execute(string $email, string $password, string $token): bool
    {
        $status = Password::reset(
            [
                'email' => $email,
                'password' => $password,
                'password_confirmation' => $password,
                'token' => $token,
            ],
            function ($eloquentUser, $password) {
                $eloquentUser->password = Hash::make($password);
                $eloquentUser->save();
            }
        );

        return $status === Password::PASSWORD_RESET;
    }
}
