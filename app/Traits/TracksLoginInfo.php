<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait TracksLoginInfo
{
    //
    public function recordLoginInfo(Request $request)
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);
    }
}
