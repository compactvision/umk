<?php

namespace App\Modules\Identity\Infrastructure\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Identity\Application\UseCases\RegisterUser;
use App\Modules\Identity\Application\UseCases\LoginUser;
use App\Modules\Identity\Domain\Exceptions\InvalidCredentialsException;
use App\Modules\Identity\Domain\Exceptions\UserNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $request, RegisterUser $useCase)
    {
        $validated = $request->validate([
            'last_name'     => 'required|string|max:255',
            'first_name'    => 'required|string|max:255',
            'post_name'     => 'nullable|string|max:255',
            'gender'        => 'required|in:male,female,other',
            'email'         => 'required|email|unique:users',
            'password'      => 'required|min:6|confirmed',
        ]);
        
        $user = $useCase->execute(
            $validated['last_name'],
            $validated['first_name'],
            $validated['post_name'] ?? null,
            $validated['gender'],
            $validated['email'],
            $validated['password']
        );
        
        Auth::loginUsingId($user->id());
        
        return redirect()->route('dashboard.index');
    }

    public function login(Request $request, LoginUser $useCase)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $userId = $useCase->execute($validated['email'], $validated['password']);
            Auth::loginUsingId($userId);

            return redirect()->route('dashboard.index');
        } catch (UserNotFoundException|InvalidCredentialsException $e) {
            return back()->withErrors(['email' => $e->getMessage()]);
        }
    }

    public function logout()
    {
        Auth::logout();
        return redirect()->route('login');
    }

    public function showRegister()
    {

        return inertia('dashboard/auth/Signup', [
            'status' => session('status')
        ]);
    }

    public function showLogin()
    {
        return inertia('dashboard/auth/Login', [
            'status' => session('status')
        ]);
    }

}
