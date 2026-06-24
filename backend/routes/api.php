<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\KanbanController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ==========================================
// Kanban API Routes
// ==========================================

Route::get('/boards', [KanbanController::class, 'getBoards']);
Route::post('/boards', [KanbanController::class, 'storeBoard']);
Route::get('/boards/{board}', [KanbanController::class, 'showBoard']);
Route::put('/boards/{board}', [KanbanController::class, 'updateBoard']);
Route::delete('/boards/{board}', [KanbanController::class, 'destroyBoard']);

Route::post('/lists', [KanbanController::class, 'storeList']);
Route::put('/lists/{list}', [KanbanController::class, 'updateList']);
Route::delete('/lists/{list}', [KanbanController::class, 'destroyList']);

Route::post('/cards', [KanbanController::class, 'storeCard']);
Route::put('/cards/{card}', [KanbanController::class, 'updateCard']);
Route::delete('/cards/{card}', [KanbanController::class, 'destroyCard']);
Route::post('/cards/{card}/tags', [KanbanController::class, 'syncTags']);
Route::post('/cards/{card}/members', [KanbanController::class, 'syncMembers']);

Route::get('/tags', [KanbanController::class, 'getTags']);
Route::post('/tags', [KanbanController::class, 'storeTag']);

Route::get('/members', [KanbanController::class, 'getMembers']);
Route::post('/members', [KanbanController::class, 'storeMember']);
Route::delete('/members/{member}', [KanbanController::class, 'destroyMember']);

