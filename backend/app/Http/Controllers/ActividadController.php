<?php

namespace App\Http\Controllers;

use App\Models\Actividad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActividadController extends Controller
{
    public function index()
    {
        try {
            $actividades = Actividad::where('activo', 1)
                ->orderBy('nombre', 'asc')
                ->get();
                
            return response()->json($actividades);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $actividad = Actividad::find($id);
        if (!$actividad) {
            return response()->json(['error' => 'Actividad no encontrada'], 404);
        }
        return response()->json($actividad);
    }

public function getHorariosPorActividad(Request $request, $id_actividad) 
{
    try {
        $clientId = $request->query('client_id');

        $horarios = DB::table('clases')
            ->join('instructores', 'clases.id_instructor', '=', 'instructores.id_instructor')
            ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
            ->where('clases.id_actividad', $id_actividad)
            ->where('clases.status', 'confirmado')
            ->select(
                'clases.id_clase',
                'clases.dia',
                'clases.hora_inicio',
                'clases.status',
                'instructores.nombre as nombre_instructor',
                'actividades.aforo as aforo_maximo',
                DB::raw("(SELECT COUNT(*) FROM inscripciones WHERE id_clase = clases.id_clase AND status != 'cancelado') as inscritos"),
                DB::raw("(SELECT COUNT(*) FROM inscripciones WHERE id_clase = clases.id_clase AND id_cliente = " . intval($clientId) . " AND status != 'cancelado') as ya_reservado")
            )
            ->orderByRaw("FIELD(clases.dia, 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo')")
            ->orderBy('clases.hora_inicio', 'asc')
            ->get();

        return response()->json($horarios);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

public function getHorarios($id)
{
    try {
        $horarios = DB::table('clases')
            ->join('instructores', 'clases.id_instructor', '=', 'instructores.id_instructor')
            ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
            ->leftJoin('inscripciones', function($join) {
                $join->on('clases.id_clase', '=', 'inscripciones.id_clase')
                     ->where('inscripciones.status', '=', 'confirmado');
            })
            ->where('clases.id_actividad', $id)
            ->select(
                'clases.id_clase',
                'clases.dia',
                'clases.hora_inicio',
                'clases.status',
                'instructores.nombre as nombre_instructor',
                'actividades.aforo as aforo_maximo',
                DB::raw('COUNT(inscripciones.id_cliente) as inscritos')
            )
            ->groupBy(
                'clases.id_clase', 'clases.dia', 'clases.hora_inicio', 
                'clases.status', 'instructores.nombre', 'actividades.aforo'
            )
            ->orderByRaw("FIELD(clases.dia, 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo')")
            ->get();

        return response()->json($horarios);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
}