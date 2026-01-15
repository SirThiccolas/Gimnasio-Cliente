<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Clase extends Model
{
    protected $table = 'clases';
    protected $primaryKey = 'id_clase';

    // Relación con Actividad
    public function actividad() {
        return $this->belongsTo(Actividad::class, 'id_actividad');
    }

    // Relación con Monitor (si tienes la tabla)
    public function monitor() {
        return $this->belongsTo(User::class, 'id_monitor'); 
    }
}