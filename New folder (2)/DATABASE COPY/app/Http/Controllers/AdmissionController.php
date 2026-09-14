<?php

namespace App\Http\Controllers;

use App\Models\AdmissionApplication;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdmissionController extends Controller
{
    public function index()
    {
        return view('admissions.index');
    }

    public function create()
    {
        return view('admissions.apply');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'dob' => ['required', 'date'],
            'gender' => ['required', 'in:Male,Female,Other'],
            'category' => ['required', 'in:General,SC,ST,OBC,Minority'],
            'religion' => ['nullable', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:255'],
            'address' => ['required', 'string'],
            'school' => ['required', 'string', 'max:255'],
            'board' => ['required', 'string', 'max:120'],
            'pass_year' => ['required', 'integer', 'digits:4', 'between:2000,2100'],
            'subject_combo' => ['required', 'string', 'max:255'],
            'percentage' => ['required', 'numeric', 'between:0,100'],
            'pref1' => ['required', 'string', 'max:120'],
            'pref2' => ['required', 'string', 'max:120'],
            'pref3' => ['required', 'string', 'max:120'],
            'doc_marksheet' => ['required', 'file', 'mimes:pdf', 'max:5120'],
            'doc_tc' => ['required', 'file', 'mimes:pdf', 'max:5120'],
            'doc_community' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
            'declaration_confirmed' => ['accepted'],
        ]);

        try {
            $applicationId = $this->generateApplicationId();

            $marksheetPath = $request->file('doc_marksheet')->store('admissions/documents', 'public');
            $tcPath = $request->file('doc_tc')->store('admissions/documents', 'public');
            $communityPath = $request->file('doc_community')
                ? $request->file('doc_community')->store('admissions/documents', 'public')
                : null;

            AdmissionApplication::create([
                'application_id' => $applicationId,
                'full_name' => $validated['full_name'],
                'dob' => $validated['dob'],
                'gender' => $validated['gender'],
                'category' => $validated['category'],
                'religion' => $validated['religion'] ?? null,
                'phone' => $validated['phone'],
                'email' => $validated['email'],
                'address' => $validated['address'],
                'school' => $validated['school'],
                'board' => $validated['board'],
                'pass_year' => $validated['pass_year'],
                'subject_combo' => $validated['subject_combo'],
                'percentage' => $validated['percentage'],
                'pref1' => $validated['pref1'],
                'pref2' => $validated['pref2'],
                'pref3' => $validated['pref3'],
                'doc_marksheet_path' => $marksheetPath,
                'doc_tc_path' => $tcPath,
                'doc_community_path' => $communityPath,
                'status' => 'pending',
            ]);

            return redirect()
                ->route('admissions.apply')
                ->with('success', "Application submitted successfully. Your ID is {$applicationId}.");
        } catch (QueryException $exception) {
            Log::error('Admission application database error', ['error' => $exception->getMessage()]);
        } catch (\Throwable $exception) {
            Log::error('Admission application submission failed', ['error' => $exception->getMessage()]);
        }

        return back()
            ->withInput()
            ->withErrors([
                'application' => 'We could not submit your application right now. Please try again in a few minutes.',
            ]);
    }

    public function status(Request $request, ?string $id = null)
    {
        $applicationId = strtoupper(trim((string) ($id ?? $request->query('id', ''))));
        $application = null;

        if ($applicationId !== '') {
            $application = AdmissionApplication::query()
                ->where('application_id', $applicationId)
                ->first();
        }

        return view('admissions.status', compact('application', 'applicationId'));
    }

    private function generateApplicationId(): string
    {
        do {
            $random = random_int(1000, 9999);
            $candidate = 'SGC' . now()->format('Y') . $random;
        } while (
            DB::table('admission_applications')->where('application_id', $candidate)->exists()
        );

        return $candidate;
    }
}
