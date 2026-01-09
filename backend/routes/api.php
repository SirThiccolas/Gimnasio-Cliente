<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ActividadController;

Route::get('/ping', function (Request $request) {
    return response()->json([
        'message' => 'pong desde Laravel'
    ]);
});
Route::post('/login', [AuthController::class, 'login']);
Route::get('/actividades', [ActividadController::class, 'index']);