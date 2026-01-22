<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/receptor-acceso', function () {
    return view('receptor');
})->name('receptor');