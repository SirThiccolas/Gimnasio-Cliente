<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ActividadController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ClaseController;
use App\Http\Controllers\InscripcionController;

Route::get('/ping', function (Request $request) {
    return response()->json([
        'message' => 'pong desde Laravel'
    ]);
});

// Credenciales
Route::post('/login', [AuthController::class, 'login']);
Route::post('/update-password', [AuthController::class, 'updatePassword']);
Route::post('/solicitar-codigo', [AuthController::class, 'solicitarCodigo']);
Route::post('/verificar-codigo', [AuthController::class, 'verificarCodigo']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Actividades
Route::get('/actividades', [ActividadController::class, 'index']);
Route::get('/actividades/{id}/horarios', [App\Http\Controllers\ActividadController::class, 'getHorarios']);

// Notificaciones
Route::get('/notificaciones/unread/{id}', [NotificationController::class, 'getUnread']); 
Route::get('/notificaciones/all/{id}', [NotificationController::class, 'getAll']); 
Route::post('/notificaciones/leer-una/{id_notificacion}', [NotificationController::class, 'marcarUnaLeida']); 
Route::post('/notificaciones/leer-todas/{id}', [NotificationController::class, 'marcarTodasLeidas']);

// Clases
Route::get('/mis-clases/{id}', [ClaseController::class, 'getMisClases']);
Route::get('/horario-hoy', [ClaseController::class, 'getHorarioHoy']);
Route::get('/actividades', function() {
    return DB::table('actividades')->get();
});

// Horario
Route::get('/horario-completo', [ClaseController::class, 'obtenerHorario']);

// Inscripciones
Route::post('/validar-acceso', [InscripcionController::class, 'validarAcceso']);