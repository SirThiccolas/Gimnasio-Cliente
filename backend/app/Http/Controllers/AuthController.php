<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Cache; // Importante añadir esto arriba
use Illuminate\Support\Facades\Validator; // Añade esto arriba
use App\Models\Cliente;

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


    public function updatePassword(Request $request) {
        $request->validate([
            'id_cliente' => 'required',
            'password_actual' => 'required',
            'password_nueva' => 'required|min:4',
        ]);

        $cliente = DB::table('clientes')
            ->where('id_cliente', $request->id_cliente)
            ->where('password', $request->password_actual)
            ->first();

        if (!$cliente) {
            return response()->json([
                'status' => 'error',
                'message' => 'La contraseña actual no es correcta.'
            ], 401);
        }

        DB::table('clientes')
            ->where('id_cliente', $request->id_cliente)
            ->update(['password' => $request->password_nueva]);

        DB::table('notificaciones')->insert([
            'id_cliente' => $request->id_cliente,
            'descripcion' => 'Se ha cambiado la contraseña de acceso.',
            'fecha_notificacion' => now()
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Contraseña actualizada correctamente.'
        ]);
    }

    public function solicitarCodigo(Request $request) {
        try {
            $dni = $request->dni;
            $emailDestino = $request->email;

            $codigo = rand(100000, 999999);

            \Illuminate\Support\Facades\Cache::put('codigo_reset_' . $dni, $codigo, now()->addMinutes(15));

            $pythonPath = '/usr/bin/python3';
            $scriptPath = base_path('scripts/enviar_correo.py');
            
            $emailEscaped = escapeshellarg($emailDestino);
            $codigoEscaped = escapeshellarg($codigo);

            $comando = "$pythonPath \"$scriptPath\" $emailEscaped $codigoEscaped 2>&1";
            $output = shell_exec($comando);

            return response()->json([
                'status' => 'success',
                'message' => 'Código enviado correctamente',
                'debug_python' => $output
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error interno: ' . $e->getMessage()
            ], 500);
        }
    }
    public function verificarCodigo(Request $request) {
        $validator = Validator::make($request->all(), [
            'dni' => 'required',
            'codigo' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Faltan datos obligatorios',
                'errors' => $validator->errors()
            ], 422);
        }

        $dni = $request->dni;
        $codigoIntroducido = $request->codigo;
        $codigoGuardado = \Illuminate\Support\Facades\Cache::get('codigo_reset_' . $dni);

        if ($codigoGuardado && $codigoGuardado == $codigoIntroducido) {
            \Illuminate\Support\Facades\Cache::forget('codigo_reset_' . $dni);
            return response()->json(['status' => 'success', 'message' => 'Código correcto']);
        }

        return response()->json(['status' => 'error', 'message' => 'Código inválido'], 400);
    }

    public function resetPassword(Request $request) {
        try {
            $dni = $request->dni;
            $nuevaPassword = $request->password;

            $cliente = \Illuminate\Support\Facades\DB::table('clientes')
                        ->where('dni', $dni)
                        ->first();

            if (!$cliente) {
                return response()->json([
                    'status' => 'error', 
                    'message' => 'El DNI no existe en nuestra base de datos.'
                ], 404);
            }

            \Illuminate\Support\Facades\DB::table('clientes')
                ->where('dni', $dni)
                ->update([
                    'password' => $nuevaPassword
                ]);

            \Illuminate\Support\Facades\DB::table('notificaciones')->insert([
                'id_cliente' => $cliente->id_cliente,
                'descripcion' => 'Se ha restablecido la contraseña de acceso.',
                'fecha_notificacion' => now()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => '¡Contraseña actualizada! Ya puedes loguearte.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de base de datos: ' . $e->getMessage()
            ], 500);
        }
    }
}