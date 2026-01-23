<?php

namespace App\Http\Controllers;

use App\Models\Reservas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReservasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function getReservas($id_cliente) 
    {
        $reservas = DB::table('inscripciones')
            ->join('clases', 'inscripciones.id_clase', '=', 'clases.id_clase')
            ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
            ->where('inscripciones.id_cliente', $id_cliente)
            ->select(
                'clases.id_clase',
                'actividades.nombre as nombre_actividad',
                'clases.hora_inicio',
                'inscripciones.status',
                'inscripciones.fecha_clase',
                'inscripciones.dia_reserva'
            )
            ->orderBy('inscripciones.fecha_clase', 'desc')
            ->orderBy('inscripciones.status', 'asc')
            ->get();

        return response()->json($reservas);
    }

    public function validarAcceso(Request $request)
    {
        $id_clase = $request->id_clase;
        $id_cliente = $request->id_cliente;
        $hoy = date('Y-m-d'); 

        // Buscamos la inscripción basándonos en el día que se imparte la clase
        $inscripcion = DB::table('inscripciones')
            ->where('id_clase', $id_clase)
            ->where('id_cliente', $id_cliente)
            ->where('fecha_clase', $hoy) // <--- Ahora comprobamos el día de la clase
            ->first();

        if (!$inscripcion) {
            return response()->json([
                'status' => 'error', 
                'message' => "No tienes reserva para la clase #$id_clase programada para hoy ($hoy)."
            ], 404);
        }

        if ($inscripcion->status === 'usado') {
            return response()->json([
                'status' => 'error', 
                'message' => "Este acceso ya ha sido utilizado."
            ], 400);
        }

        // Actualizamos el estado
        DB::table('inscripciones')
            ->where('id_clase', $id_clase)
            ->where('id_cliente', $id_cliente)
            ->where('fecha_clase', $hoy)
            ->update(['status' => 'usado']);

        return response()->json(['status' => 'success']);
    }

    public function checkStatus($id_cliente, $id_clase)
    {
        $hoy = date('Y-m-d');
        $status = DB::table('inscripciones')
            ->where('id_cliente', $id_cliente)
            ->where('id_clase', $id_clase)
            ->where('fecha_clase', $hoy) // Comprobamos la clase de hoy
            ->value('status');

        return response()->json(['status' => $status]);
    }
}
