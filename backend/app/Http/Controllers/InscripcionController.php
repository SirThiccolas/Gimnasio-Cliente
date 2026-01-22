<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InscripcionController extends Controller
{
    public function validarAcceso(Request $request)
    {
        $id_clase = $request->id_clase;
        $id_cliente = $request->id_cliente;
        $hoy = Carbon::today()->toDateString(); // Formato YYYY-MM-DD

        // Buscamos la inscripción para hoy
        $inscripcion = DB::table('inscripciones')
            ->where('id_clase', $id_clase)
            ->where('id_cliente', $id_cliente)
            ->where('dia_reserva', $hoy)
            ->first();

        if (!$inscripcion) {
            return response()->json(['status' => 'error', 'message' => 'No se encontró reserva para hoy'], 404);
        }

        if ($inscripcion->status === 'usado') {
            return response()->json(['status' => 'error', 'message' => 'El código ya ha sido validado'], 400);
        }

        if ($inscripcion->status === 'cancelado') {
            return response()->json(['status' => 'error', 'message' => 'La reserva está cancelada'], 400);
        }

        // Actualizamos a 'usado' según tu nuevo ENUM
        DB::table('inscripciones')
            ->where('id_clase', $id_clase)
            ->where('id_cliente', $id_cliente)
            ->update(['status' => 'usado']);

        return response()->json(['status' => 'success', 'message' => '¡Acceso concedido! Bienvenido']);
    }
}