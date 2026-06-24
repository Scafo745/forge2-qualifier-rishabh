<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Board extends Model
{
    protected $fillable = ['name'];

    public function kanbanLists()
    {
        return $this->hasMany(KanbanList::class, 'board_id')->orderBy('position');
    }
}
