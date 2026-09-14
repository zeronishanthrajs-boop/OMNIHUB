<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\FacultyProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;

class FacultyController extends Controller
{
    public function index(): View
    {
        try {
            $tableExists = Schema::hasTable('faculty_profiles');
            $faculty = $tableExists ? FacultyProfile::with('department')->latest()->get() : collect();
            $faculties = $faculty;
            $departments = Schema::hasTable('departments') ? Department::all() : collect();

            return view('admin.faculty.index', compact('faculty', 'faculties', 'departments', 'tableExists'));
        } catch (\Throwable $exception) {
            report($exception);

            return view('admin.faculty.index', [
                'faculty' => collect(),
                'faculties' => collect(),
                'departments' => collect(),
                'tableExists' => Schema::hasTable('faculty_profiles'),
            ])->with('error', 'Unable to load faculty records right now.');
        }
    }

    public function store(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'designation' => 'required|string|max:255',
                'qualification' => 'required|string|max:255',
                'email' => 'required|email',
                'phone' => 'nullable|string|max:20',
                'bio' => 'nullable|string',
                'experience' => 'nullable|string|max:255',
                'department_id' => 'nullable|exists:departments,id',
                'is_hod' => 'nullable|boolean',
            ]);

            $payload = array_merge($validated, [
                'is_hod' => $request->boolean('is_hod'),
                'department' => optional(Department::find($validated['department_id'] ?? null))->name,
                'experience_years' => $this->extractExperienceYears($validated['experience'] ?? null),
                'is_active' => $request->boolean('is_active', true),
            ]);

            FacultyProfile::create($this->filterToExistingColumns($payload));

            return redirect()->route('admin.faculty.index')->with('success', 'Faculty saved.');
        } catch (\Throwable $exception) {
            Log::error('Faculty save: ' . $exception->getMessage());

            return back()
                ->withInput()
                ->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function update(Request $request, FacultyProfile $faculty): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'designation' => 'required|string|max:255',
                'qualification' => 'required|string|max:255',
                'email' => 'required|email',
                'phone' => 'nullable|string|max:20',
                'bio' => 'nullable|string',
                'experience' => 'nullable|string|max:255',
                'department_id' => 'nullable|exists:departments,id',
                'is_hod' => 'nullable|boolean',
            ]);

            $payload = [
                ...$validated,
                'is_hod' => $request->boolean('is_hod'),
                'department' => optional(Department::find($validated['department_id'] ?? null))->name,
                'experience_years' => $this->extractExperienceYears($validated['experience'] ?? null),
                'is_active' => $request->boolean('is_active', true),
            ];

            $faculty->update($this->filterToExistingColumns($payload));

            return back()->with('success', 'Faculty profile updated.');
        } catch (\Throwable $exception) {
            Log::error('Faculty update: ' . $exception->getMessage());

            return back()
                ->withInput()
                ->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function destroy(FacultyProfile $faculty): RedirectResponse
    {
        $faculty->delete();

        return back()->with('success', 'Faculty profile removed.');
    }

    private function filterToExistingColumns(array $payload): array
    {
        $columns = Schema::getColumnListing('faculty_profiles');

        return collect($payload)
            ->only($columns)
            ->all();
    }

    private function extractExperienceYears(?string $experience): int
    {
        if (!$experience) {
            return 0;
        }

        preg_match('/\d+/', $experience, $matches);

        return isset($matches[0]) ? (int) $matches[0] : 0;
    }
}
