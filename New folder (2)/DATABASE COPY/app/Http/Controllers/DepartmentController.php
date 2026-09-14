<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Support\Facades\Schema;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Schema::hasTable('departments')
            ? Department::query()->latest()->get()
            : collect();

        return view('departments.index', compact('departments'));
    }

    public function show(int $id)
    {
        abort_unless(Schema::hasTable('departments'), 404);

        $dept = Department::with('facultyProfiles')->findOrFail($id);
        $hod = $dept->facultyProfiles()->where('is_hod', true)->first();

        return view('departments.show', compact('dept', 'hod'));
    }
}
