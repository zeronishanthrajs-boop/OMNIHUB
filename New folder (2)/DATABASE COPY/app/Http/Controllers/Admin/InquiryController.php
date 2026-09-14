<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactInquiry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Schema;
use Illuminate\View\View;

class InquiryController extends Controller
{
    public function index(): View
    {
        $tableExists = Schema::hasTable('contact_inquiries');

        $inquiries = $tableExists
            ? ContactInquiry::query()->latest()->paginate(20)
            : collect();

        return view('admin.inquiries.index', compact('inquiries', 'tableExists'));
    }

    public function destroy(ContactInquiry $inquiry): RedirectResponse
    {
        $inquiry->delete();

        return back()->with('success', 'Inquiry deleted.');
    }
}
