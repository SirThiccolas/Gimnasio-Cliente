<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'dni' => 'required',
            'password' => 'required'
        ]);

        $user = DB::table('clientes')
            ->where('dni', $request->dni)
            ->where('password', $request->password)
            ->where('activo', 1)
            ->first();

        if ($user) {
            return response()->json([
                'status' => 'success',
                'message' => 'Bienvenido ' . $user->nombre,
                'user' => $user
            ], 200);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Credenciales incorrectas o usuario inactivo'
        ], 401);
    }
    public function solicitarCodigo(Request $request) {
        $email = $request->email;
        $codigo = rand(100000, 999999);

        // 1. Guardar en la DB (Asegúrate de que esta parte funcione)
        DB::table('password_resets')->updateOrInsert(
            ['email' => $email],
            ['token' => $codigo, 'created_at' => now()]
        );

        // 2. CONFIGURACIÓN DE RUTAS (IMPORTANTE)
        $pythonPath = '/usr/bin/python3'; // La ruta que te dio el comando 'which python3'
        $scriptPath = base_path('scripts/enviar_correo.py');

        // 3. EJECUTAR Y CAPTURAR ERRORES
        // El "2>&1" es mágico: redirige los errores de Python a la variable $output
        $comando = "$pythonPath $scriptPath $email $codigo 2>&1";
        $output = shell_exec($comando);

        // 4. REVISAR LOGS
        // Abre el archivo 'storage/logs/laravel.log' para ver qué dice esto:
        \Log::info("Ejecutando: " . $comando);
        \Log::info("Resultado Python: " . $output);

        if (str_contains($output, 'EXITO') || str_contains($output, 'Correctamente')) {
            return response()->json(['message' => 'Código enviado']);
        } else {
            return response()->json(['error' => 'Error al enviar: ' . $output], 500);
        }
}
}