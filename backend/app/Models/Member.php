<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    protected $fillable = ['name', 'email', 'avatar_url'];

    public function cards()
    {
        return $this->belongsToMany(Card::class);
    }
}
