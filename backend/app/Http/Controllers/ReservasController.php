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
        ->join('actividades', 'clases.id_actividad', '=', 'actividades.id_actividad') // Unimos con actividades
        ->where('inscripciones.id_cliente', $id_cliente)
        ->select(
            'actividades.nombre as nombre_actividad',
            'clases.hora_inicio',
            'inscripciones.status',
            'inscripciones.fecha_clase',
            'inscripciones.dia_reserva',
        )
        ->orderBy('inscripciones.fecha_clase', 'desc')
        ->get();

    return response()->json($reservas);
}

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Reservas $reservas)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Reservas $reservas)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Reservas $reservas)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Reservas $reservas)
    {
        //
    }
}
