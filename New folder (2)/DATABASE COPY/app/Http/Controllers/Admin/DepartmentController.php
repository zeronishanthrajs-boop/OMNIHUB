<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;

class DepartmentController extends Controller
{
    public function index(): View
    {
        try {
            $tableExists = Schema::hasTable('departments');
            $departments = $tableExists
                ? Department::latest()->get()
                : collect();

            return view('admin.departments.index', compact('departments', 'tableExists'));
        } catch (\Throwable $exception) {
            report($exception);

            return view('admin.departments.index', [
                'departments' => collect(),
                'tableExists' => Schema::hasTable('departments'),
            ])->with('error', 'Unable to load departments right now.');
        }
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(Schema::hasTable('departments'), 500, 'departments table not found.');

        Department::create($this->validated($request));

        return back()->with('success', 'Department saved.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $department->update($this->validated($request));

        return back()->with('success', 'Department updated.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        $department->delete();

        return back()->with('success', 'Department removed.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:15'],
            'about' => ['nullable', 'string'],
            'established_year' => ['nullable', 'integer', 'digits:4', 'between:1900,2100'],
            'research_center' => ['nullable', 'boolean'],
        ]);
    }
}
