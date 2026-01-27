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
            $hoy = Carbon::now()->format('Y-m-d');

            $misClases = DB::table('inscripciones')
                ->join('clases', 'inscripciones.id_clase', '=', 'clases.id_clase')
                ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
                ->where('inscripciones.id_cliente', $id_cliente)
                ->where('inscripciones.fecha_clase', '=', $hoy)
                ->where('inscripciones.status', '!=', 'cancelado')
                ->select(
                    'clases.id_clase',
                    'clases.hora_inicio as hora',
                    'actividades.nombre as nombre_actividad',
                    'inscripciones.status'
                )
                ->orderBy('clases.hora_inicio', 'asc')
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
                    'actividades.nombre as nombre_actividad',
                    'actividades.duracion'
                )
                ->orderBy('clases.hora_inicio', 'asc')
                ->get();

            return response()->json($horario);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function obtenerHorario(Request $request) {
        $diaFiltro = $request->query('dia'); 
        $clientId = $request->query('client_id');

        $diasSemanas = [
            'Sunday' => 'domingo', 'Monday' => 'lunes', 'Tuesday' => 'martes', 
            'Wednesday' => 'miércoles', 'Thursday' => 'jueves', 
            'Friday' => 'viernes', 'Saturday' => 'sábado'
        ];
        
        $ahora = Carbon::now();
        $nombreHoy = $diasSemanas[$ahora->format('l')];
        $horaActual = $ahora->format('H:i:s');

        $query = DB::table('clases')
            ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
            ->join('instructores', 'clases.id_instructor', '=', 'instructores.id_instructor')
            ->select(
                'clases.id_clase',
                'clases.dia',
                'clases.hora_inicio',
                'clases.status',
                'actividades.nombre as nombre_actividad',
                'actividades.aforo as aforo',
                'instructores.nombre as nombre_instructor',
                DB::raw("(SELECT COUNT(*) FROM inscripciones WHERE id_clase = clases.id_clase AND status != 'cancelado') as inscritos_count"),
                DB::raw("(SELECT COUNT(*) FROM inscripciones WHERE id_clase = clases.id_clase AND id_cliente = " . intval($clientId) . " AND status != 'cancelado') as ya_reservado")
            )
            ->where('clases.status', 'confirmado');

        if ($diaFiltro && strtolower($diaFiltro) !== 'todos') {
            $query->whereRaw('LOWER(clases.dia) = ?', [strtolower($diaFiltro)]);
        } else {
            $query->where(function($q) use ($nombreHoy, $horaActual) {
                $q->whereRaw('LOWER(clases.dia) != ?', [strtolower($nombreHoy)])
                ->orWhere('clases.hora_inicio', '>', $horaActual);
            });
        }

        $resultado = $query->orderBy('clases.hora_inicio', 'asc')->get();
        
        return response()->json($resultado);
    }

    public function volverAReservar($id_cliente)
    {
        try {
            $clasesPasadas = DB::table('inscripciones')
                ->join('clases', 'inscripciones.id_clase', '=', 'clases.id_clase')
                ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
                ->join('instructores', 'clases.id_instructor', '=', 'instructores.id_instructor')
                ->where('inscripciones.id_cliente', $id_cliente)
                ->where('inscripciones.status', '=', 'usado')
                ->select(
                    'clases.id_clase',
                    'clases.dia',
                    'clases.hora_inicio',
                    'clases.aforo_maximo',
                    'actividades.nombre as nombre_actividad',
                    'actividades.duracion',
                    'instructores.nombre as nombre_instructor',
                    DB::raw("(SELECT COUNT(*) FROM inscripciones WHERE id_clase = clases.id_clase AND status != 'cancelado') as inscritos_count")
                )
                ->orderBy('inscripciones.id_inscripcion', 'desc')
                ->get()
                ->unique('nombre_actividad')
                ->values()
                ->take(5);

            return response()->json($clasesPasadas);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}