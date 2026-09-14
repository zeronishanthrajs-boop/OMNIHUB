<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyProfile extends Model
{
    protected $fillable = [
        'name',
        'designation',
        'qualification',
        'email',
        'phone',
        'bio',
        'experience',
        'department_id',
        'is_hod',
        'photo',
        'department',
        'specialization',
        'experience_years',
        'photo_path',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'experience_years' => 'integer',
        'department_id' => 'integer',
        'is_hod' => 'boolean',
        'display_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function departmentRecord(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
