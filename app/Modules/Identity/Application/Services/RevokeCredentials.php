<?php

namespace App\Modules\Identity\Application\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class RevokeCredentials
{
    public function execute(User $user, ?string $keepSession = null): void
    {
        $user->setRememberToken(Str::random(60));
        $user->save();
        DB::table('personal_access_tokens')->where('tokenable_type', $user->getMorphClass())->where('tokenable_id', $user->id)->delete();
        if (config('session.driver') === 'database') {
            $sessions = DB::connection(config('session.connection'))->table(config('session.table', 'sessions'))->where('user_id', $user->id);
            if ($keepSession !== null) {
                $sessions->where('id', '!=', $keepSession);
            }
            $sessions->delete();
        }
    }
}
