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
            // 1. Obtenemos el nombre del día actual en español y minúsculas (ej: 'viernes')
            $diasSemanas = [
                'Sunday' => 'domingo', 'Monday' => 'lunes', 'Tuesday' => 'martes', 
                'Wednesday' => 'miércoles', 'Thursday' => 'jueves', 
                'Friday' => 'viernes', 'Saturday' => 'sábado'
            ];
            $diaHoy = $diasSemanas[Carbon::now()->format('l')];

            // 2. Usamos la tabla 'inscripciones' que es la que tienes en tu DB
            $misClases = DB::table('inscripciones')
                ->join('clases', 'inscripciones.id_clase', '=', 'clases.id_clase')
                ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
                ->where('inscripciones.id_cliente', $id_cliente)
                ->where('clases.dia', '=', $diaHoy) // Filtramos por el día de la semana
                ->select(
                    'clases.id_clase',
                    'clases.hora_inicio as hora', // Renombramos para el frontend
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
                'instructores.nombre as nombre_instructor'
            )
            ->where('clases.status', 'confirmado') // Solo mostrar las que no están canceladas
            ->orderBy('clases.hora_inicio', 'asc');

        if ($dia && $dia !== 'Todos') {
            // Usamos lowercase para evitar problemas de "Lunes" vs "lunes"
            $query->whereRaw('LOWER(clases.dia) = ?', [strtolower($dia)]);
        }

        return response()->json($query->get());
    }
}