<?php

use App\Modules\Newsletter\Infrastructure\Http\Controllers\NewsletterController;
use Illuminate\Support\Facades\Route;

Route::prefix('newsletter')->group(function () {
    Route::post('/subscribe', [NewsletterController::class, 'subscribe']);
    Route::post('/unsubscribe', [NewsletterController::class, 'unsubscribe']);
});
