<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class SwitchPageController extends Controller
{
    //
    public function home()
    {
        return Inertia::render('Homepage');
    }

    public function admission()
    {
        return Inertia::render('Admissionpage');
    }
}
