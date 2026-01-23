<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ClaseController extends Controller
{
    public function getMisClases($id_cliente)
    {
        try {
            $diasSemanas = [
                'Sunday' => 'domingo', 'Monday' => 'lunes', 'Tuesday' => 'martes', 
                'Wednesday' => 'miércoles', 'Thursday' => 'jueves', 
                'Friday' => 'viernes', 'Saturday' => 'sábado'
            ];
            $diaHoy = $diasSemanas[Carbon::now()->format('l')];

            $misClases = DB::table('inscripciones')
                ->join('clases', 'inscripciones.id_clase', '=', 'clases.id_clase')
                ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
                ->where('inscripciones.id_cliente', $id_cliente)
                ->where('clases.dia', '=', $diaHoy)
                ->where('clases.status', '=', 'confirmado')
                ->select(
                    'clases.id_clase',
                    'clases.hora_inicio as hora',
                    'actividades.nombre as nombre_actividad'
                )
                ->get();

            return response()->json($misClases);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getHorarioHoy()
    {
        try {
            $diasSemanas = [
                'Sunday' => 'domingo', 'Monday' => 'lunes', 'Tuesday' => 'martes', 
                'Wednesday' => 'miércoles', 'Thursday' => 'jueves', 
                'Friday' => 'viernes', 'Saturday' => 'sábado'
            ];
            $diaHoy = $diasSemanas[Carbon::now()->format('l')];

            $horario = DB::table('clases')
                ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
                ->where('clases.dia', '=', $diaHoy)
                ->where('clases.status', '=', 'confirmado')
                ->select(
                    'clases.id_clase',
                    'clases.hora_inicio as hora',
                    'actividades.nombre as nombre_actividad'
                )
                ->orderBy('clases.hora_inicio', 'asc')
                ->get();

            return response()->json($horario);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

 public function obtenerHorario(Request $request) {
    $dia = $request->query('dia'); 
    $clientId = $request->query('client_id'); // Recibimos el ID desde React Native

    $query = DB::table('clases')
        ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
        ->join('instructores', 'clases.id_instructor', '=', 'instructores.id_instructor')
        ->select(
            'clases.id_clase',
            'clases.dia',
            'clases.hora_inicio',
            'clases.status',
            'actividades.nombre as nombre_actividad',
            'actividades.descripcion',
            'actividades.aforo',
            'instructores.nombre as nombre_instructor',
            // --- NUEVA LÓGICA DE CUPOS ---
            // Cuenta cuántas inscripciones confirmadas hay para esta clase
            DB::raw("(SELECT COUNT(*) FROM inscripciones WHERE id_clase = clases.id_clase AND status != 'cancelado') as inscritos_count"),
            // Devuelve 1 si el cliente ya está inscrito, 0 si no
            DB::raw("(SELECT COUNT(*) FROM inscripciones WHERE id_clase = clases.id_clase AND id_cliente = " . intval($clientId) . " AND status != 'cancelado') as ya_reservado")
        )
        ->where('clases.status', 'confirmado')
        ->orderBy('clases.hora_inicio', 'asc');

    if ($dia && strtolower($dia) !== 'todos') {
        $query->whereRaw('LOWER(clases.dia) = ?', [strtolower($dia)]);
    }

    return response()->json($query->get());
}
}