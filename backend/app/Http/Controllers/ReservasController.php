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

public function store(Request $request)
{
    try {
        $id_cliente = $request->id_cliente;
        $id_clase = $request->id_clase;

        // 1. Obtener la clase y su aforo máximo
        $clase = DB::table('clases')->where('id_clase', $id_clase)->first();
        if (!$clase) return response()->json(['message' => 'Clase no encontrada'], 404);

        // 2. Calcular fecha de la clase (mismo código que ya tienes)
        $dias = ['lunes'=>1,'martes'=>2,'miercoles'=>3,'jueves'=>4,'viernes'=>5,'sabado'=>6,'domingo'=>0];
        $hoyNum = date('w');
        $objetivo = $dias[strtolower($clase->dia)] ?? $hoyNum;
        $dif = $objetivo - $hoyNum;
        if ($dif < 0) $dif += 7;
        $fechaClase = date('Y-m-d', strtotime("+$dif days"));

        // 3. COMPPROBACIÓN 1: ¿Ya está inscrito?
        $yaInscrito = DB::table('inscripciones')
            ->where('id_cliente', $id_cliente)
            ->where('id_clase', $id_clase)
            ->where('fecha_clase', $fechaClase)
            ->where('status', '!=', 'cancelado')
            ->exists();

        if ($yaInscrito) {
            return response()->json(['message' => 'Ya estás inscrito en esta clase.'], 400);
        }

        // 4. COMPROBACIÓN 2: ¿Aforo completo?
        $inscritosActuales = DB::table('inscripciones')
            ->where('id_clase', $id_clase)
            ->where('fecha_clase', $fechaClase)
            ->where('status', '!=', 'cancelado')
            ->count();

        if ($inscritosActuales >= $clase->aforo) {
            return response()->json(['message' => 'Lo sentimos, la clase está llena.'], 400);
        }

        // 5. Todo OK -> Insertar
        DB::table('inscripciones')->insert([
            'id_cliente' => $id_cliente,
            'id_clase' => $id_clase,
            'fecha_clase' => $fechaClase,
            'dia_reserva' => date('Y-m-d H:i:s'),
            'status' => 'confirmado'
        ]);

        return response()->json(['message' => 'Reserva confirmada'], 201);

    } catch (\Exception $e) {
        return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
    }
}
}
