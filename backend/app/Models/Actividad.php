<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Actividad extends Model
{
    protected $table = 'actividades';
    protected $primaryKey = 'id_actividad'; // Tu clave primaria
    protected $fillable = ['nombre', 'descripcion', 'capacidad', 'duracion'];
    public $timestamps = false; // Si no tienes created_at y updated_at
}