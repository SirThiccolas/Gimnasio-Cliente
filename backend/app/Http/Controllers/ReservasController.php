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
                'actividades.activo as actividad_activa', 
                'clases.hora_inicio',
                'clases.status as status_clase',
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

        $inscripcion = DB::table('inscripciones')
            ->where('id_clase', $id_clase)
            ->where('id_cliente', $id_cliente)
            ->where('fecha_clase', $hoy)
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
            ->where('fecha_clase', $hoy)
            ->value('status');

        return response()->json(['status' => $status]);
    }

    public function getVolverAReservar($id_cliente) {
        $reservas = DB::table('inscripciones')
            ->join('clases', 'inscripciones.id_clase', '=', 'clases.id_clase')
            ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
            ->where('inscripciones.id_cliente', $id_cliente)
            ->where('inscripciones.fecha_clase', '>=', now()->subDays(30))
            ->where('inscripciones.status', '=', 'usado')
            ->where('actividades.activo', '1')
            ->select('actividades.id_actividad', 'actividades.nombre', 'actividades.descripcion', 'clases.hora_inicio')
            ->distinct()
            ->get();

        return response()->json($reservas);
    }


    public function store(Request $request)
        {
            try {
                $id_cliente = $request->id_cliente;
                $id_clase = $request->id_clase;

                $clase = DB::table('clases')
                    ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
                    ->where('clases.id_clase', $id_clase)
                    ->select('clases.*', 'actividades.nombre as nombre_actividad', 'actividades.aforo')
                    ->first();

                if (!$clase) {
                    return response()->json(['message' => 'Clase no encontrada'], 404);
                }

                $dias = ['lunes'=>1,'martes'=>2,'miercoles'=>3,'jueves'=>4,'viernes'=>5,'sabado'=>6,'domingo'=>0];
                $hoyNum = (int)date('w'); 
                $objetivo = $dias[strtolower($clase->dia)] ?? $hoyNum;
                
                $dif = $objetivo - $hoyNum;
                if ($dif < 0) $dif += 7;

                if ($dif === 0) {
                    $horaActual = date('H:i:s');
                    if ($horaActual > $clase->hora_inicio) {
                        $dif = 7;
                    }
                }

                $fechaClase = date('Y-m-d', strtotime("+$dif days"));

                $yaInscrito = DB::table('inscripciones')
                    ->where('id_cliente', $id_cliente)
                    ->where('id_clase', $id_clase)
                    ->where('fecha_clase', $fechaClase)
                    ->where('status', '!=', 'cancelado')
                    ->exists();

                if ($yaInscrito) {
                    return response()->json(['message' => 'Ya estás inscrito para esta fecha (' . date('d/m', strtotime($fechaClase)) . ').'], 400);
                }

                $inscritosActuales = DB::table('inscripciones')
                    ->where('id_clase', $id_clase)
                    ->where('fecha_clase', $fechaClase)
                    ->where('status', '!=', 'cancelado')
                    ->count();

                if ($inscritosActuales >= $clase->aforo) {
                    return response()->json(['message' => 'Lo sentimos, la clase para ese día está llena.'], 400);
                }

                DB::table('inscripciones')->insert([
                    'id_cliente' => $id_cliente,
                    'id_clase' => $id_clase,
                    'fecha_clase' => $fechaClase,
                    'dia_reserva' => now(),
                    'status' => 'confirmado'
                ]);

                DB::table('notificaciones')->insert([
                    'id_cliente' => $id_cliente,
                    'descripcion' => "Reserva confirmada: {$clase->nombre_actividad} para el " . date('d/m', strtotime($fechaClase)) . " a las " . substr($clase->hora_inicio, 0, 5) . ".",
                    'fecha_notificacion' => now()
                ]);

                return response()->json(['message' => 'Reserva confirmada'], 201);

            } catch (\Exception $e) {
                return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
            }
        }

    public function destroy(Request $request, $id)
    {
        try {
            $id_cliente = $request->query('id_cliente');

            if (!$id_cliente) {
                return response()->json(['message' => 'Falta el ID del cliente'], 400);
            }

            $reserva = DB::table('inscripciones')
                ->join('clases', 'inscripciones.id_clase', '=', 'clases.id_clase')
                ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad')
                ->where('inscripciones.id_clase', $id)
                ->where('inscripciones.id_cliente', $id_cliente)
                ->select('inscripciones.id_cliente', 'actividades.nombre as nombre_actividad')
                ->first();

            if (!$reserva) {
                return response()->json(['message' => 'Reserva no encontrada para este usuario'], 404);
            }

            DB::table('inscripciones')
                ->where('id_clase', $id)
                ->where('id_cliente', $id_cliente)
                ->delete();

            DB::table('notificaciones')->insert([
                'id_cliente' => $id_cliente,
                'descripcion' => "Has cancelado tu reserva de {$reserva->nombre_actividad}.",
                'fecha_notificacion' => now()
            ]);

            return response()->json(['message' => 'Reserva cancelada correctamente'], 200);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }
}
