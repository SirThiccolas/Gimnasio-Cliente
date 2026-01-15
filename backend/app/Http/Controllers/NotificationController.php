<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    // Obtener todas (para la pantalla de historial)
    public function getAll($id) {
        $notifs = DB::table('notificaciones')
            ->where('id_cliente', $id)
            ->orderBy('fecha_notificacion', 'desc')
            ->get();
        return response()->json($notifs);
    }

    // Obtener solo NO leídas (para la campana)
    public function getUnread($id) {
        $notifs = DB::table('notificaciones')
            ->where('id_cliente', $id)
            ->where('leido', 0)
            ->orderBy('fecha_notificacion', 'desc')
            ->get();
        return response()->json($notifs);
    }

    // Marcar una sola como leída
    public function marcarUnaLeida($id_notificacion) {
        DB::table('notificaciones')
            ->where('id_notificacion', $id_notificacion)
            ->update(['leido' => 1]);
        return response()->json(['status' => 'success']);
    }

    // Marcar todas como leídas
    public function marcarTodasLeidas($id) {
        DB::table('notificaciones')
            ->where('id_cliente', $id)
            ->update(['leido' => 1]);
        return response()->json(['status' => 'success']);
    }
}