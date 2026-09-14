<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Notice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class NoticeController extends Controller
{
    public function index(): View
    {
        try {
            $tableExists = Schema::hasTable('notices');
            $notices = $tableExists
                ? Notice::with(['department', 'poster'])->latest('published_at')->latest()->get()
                : collect();
            $departments = Schema::hasTable('departments')
                ? Department::orderBy('name')->get()
                : collect();

            return view('admin.notices.index', compact('notices', 'departments', 'tableExists'));
        } catch (\Throwable $exception) {
            report($exception);

            return view('admin.notices.index', [
                'notices' => collect(),
                'departments' => collect(),
                'tableExists' => Schema::hasTable('notices'),
            ])->with('error', 'Unable to load notices right now.');
        }
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless(Schema::hasTable('notices'), 500, 'notices table not found.');

        $payload = $this->validated($request);
        $payload['is_published'] = $request->boolean('is_published');
        $payload['posted_by'] = (int) $request->user()->id;
        $payload['department_id'] = $payload['department_id'] ?? null;
        $payload['attachment_path'] = $payload['attachment_path'] ?? null;
        $payload['published_at'] = $payload['published_at'] ?? null;
        $payload['expires_at'] = $payload['expires_at'] ?? null;

        if ($payload['is_published'] && empty($payload['published_at'])) {
            $payload['published_at'] = now();
        }

        if (!$payload['is_published']) {
            $payload['published_at'] = null;
        }

        Notice::create($payload);

        return back()->with('success', 'Notice saved.');
    }

    public function update(Request $request, Notice $notice): RedirectResponse
    {
        $payload = $this->validated($request);
        $payload['is_published'] = $request->boolean('is_published');
        $payload['department_id'] = $payload['department_id'] ?? null;
        $payload['attachment_path'] = $payload['attachment_path'] ?? null;
        $payload['published_at'] = $payload['published_at'] ?? null;
        $payload['expires_at'] = $payload['expires_at'] ?? null;

        if ($payload['is_published'] && empty($payload['published_at'])) {
            $payload['published_at'] = now();
        }

        if (!$payload['is_published']) {
            $payload['published_at'] = null;
        }

        $notice->update($payload);

        return back()->with('success', 'Notice updated.');
    }

    public function destroy(Notice $notice): RedirectResponse
    {
        $notice->delete();

        return back()->with('success', 'Notice removed.');
    }

    private function validated(Request $request): array
    {
        $departmentRules = ['nullable'];
        if (Schema::hasTable('departments')) {
            $departmentRules[] = 'exists:departments,id';
        }

        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'category' => ['required', Rule::in(['exam', 'admission', 'general', 'event', 'scholarship'])],
            'department_id' => $departmentRules,
            'attachment_path' => ['nullable', 'string', 'max:255'],
            'published_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:published_at'],
            'is_published' => ['nullable', 'boolean'],
        ]);
    }
}
