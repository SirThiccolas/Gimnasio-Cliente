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
    
    // Obtenemos la fecha de hoy en formato YYYY-MM-DD
    $hoy = date('Y-m-d'); 

    // Buscamos la inscripción
    $inscripcion = DB::table('inscripciones')
        ->where('id_clase', $id_clase)
        ->where('id_cliente', $id_cliente)
        ->where('dia_reserva', $hoy) // <--- ¡Asegúrate de que el nombre coincida con tu SQL!
        ->first();

    if (!$inscripcion) {
        return response()->json([
            'status' => 'error', 
            'message' => "No hay reserva para hoy ($hoy). Revisa la fecha en la BD."
        ], 404);
    }

    // Si existe, actualizamos
    DB::table('inscripciones')
        ->where('id_clase', $id_clase)
        ->where('id_cliente', $id_cliente)
        ->update(['status' => 'usado']);

    return response()->json(['status' => 'success']);
}
}