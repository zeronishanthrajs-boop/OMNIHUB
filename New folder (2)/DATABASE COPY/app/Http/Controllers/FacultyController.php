<?php

namespace App\Http\Controllers;

use App\Models\FacultyProfile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class FacultyController extends Controller
{
    public function index()
    {
        $facultyMembers = $this->getFacultyMembers();

        return view('faculty.index', compact('facultyMembers'));
    }

    public function show(int $id)
    {
        return view('faculty.show', compact('id'));
    }

    private function getFacultyMembers(): Collection
    {
        if (Schema::hasTable('faculty_profiles')) {
            $profiles = FacultyProfile::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get();

            if ($profiles->isNotEmpty()) {
                return $profiles;
            }
        }

        return collect([
            ['name' => 'Dr. Joseph Thomas', 'designation' => 'Asst. Professor', 'department' => 'Physics', 'qualification' => 'PhD', 'specialization' => 'Condensed Matter', 'experience_years' => 12, 'email' => null],
            ['name' => 'Dr. Mini Varghese', 'designation' => 'Professor', 'department' => 'Chemistry', 'qualification' => 'PhD', 'specialization' => 'Organic Chemistry', 'experience_years' => 15, 'email' => null],
            ['name' => 'Prof. Renu James', 'designation' => 'Asst. Professor', 'department' => 'Commerce', 'qualification' => 'M.Com, NET', 'specialization' => 'Finance', 'experience_years' => 10, 'email' => null],
            ['name' => 'Dr. Anjali Nair', 'designation' => 'HOD', 'department' => 'English', 'qualification' => 'PhD', 'specialization' => 'Literary Studies', 'experience_years' => 14, 'email' => null],
            ['name' => 'Dr. Sam George', 'designation' => 'Asst. Professor', 'department' => 'Food Technology', 'qualification' => 'PhD', 'specialization' => 'Food Process Engineering', 'experience_years' => 9, 'email' => null],
            ['name' => 'Prof. Nisha Mathew', 'designation' => 'Asst. Professor', 'department' => 'Computer Science', 'qualification' => 'M.Tech', 'specialization' => 'Data Systems', 'experience_years' => 8, 'email' => null],
        ]);
    }
}
