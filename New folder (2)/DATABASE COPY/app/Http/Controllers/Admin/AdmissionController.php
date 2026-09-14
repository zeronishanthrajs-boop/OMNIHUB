<?php

namespace App\Http\Controllers\Admin;

use App\Models\AdmissionApplication;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;

class AdmissionController extends Controller
{
    public function index(): View
    {
        $tableExists = Schema::hasTable('admission_applications');

        $applications = $tableExists
            ? AdmissionApplication::query()->latest()->paginate(20)
            : collect();

        return view('admin.admissions.index', compact('applications', 'tableExists'));
    }

    public function updateStatus(Request $request, AdmissionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,shortlisted,admitted,rejected'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $application->update([
            'status' => $validated['status'],
            'remarks' => $validated['remarks'] ?? null,
        ]);

        return back()->with('success', 'Admission status updated.');
    }
}
