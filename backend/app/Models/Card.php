<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    protected $fillable = ['kanban_list_id', 'title', 'description', 'due_date', 'position'];

    public function kanbanList()
    {
        return $this->belongsTo(KanbanList::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }

    public function members()
    {
        return $this->belongsToMany(Member::class);
    }
}
