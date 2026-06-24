<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KanbanList extends Model
{
    protected $fillable = ['board_id', 'name', 'position'];

    public function board()
    {
        return $this->belongsTo(Board::class);
    }

    public function cards()
    {
        return $this->hasMany(Card::class, 'kanban_list_id')->orderBy('position');
    }
}
