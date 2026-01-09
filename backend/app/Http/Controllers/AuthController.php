<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
}