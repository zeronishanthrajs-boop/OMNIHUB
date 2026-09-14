<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdmissionApplication extends Model
{
    protected $fillable = [
        'application_id',
        'full_name',
        'dob',
        'gender',
        'category',
        'religion',
        'phone',
        'email',
        'address',
        'school',
        'board',
        'pass_year',
        'subject_combo',
        'percentage',
        'pref1',
        'pref2',
        'pref3',
        'doc_marksheet_path',
        'doc_tc_path',
        'doc_community_path',
        'status',
        'remarks',
    ];

    protected $casts = [
        'dob' => 'date',
        'pass_year' => 'integer',
        'percentage' => 'decimal:2',
    ];
}
