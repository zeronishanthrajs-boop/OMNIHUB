<?php

namespace App\Http\Controllers;

use App\Models\ContactInquiry;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function index()
    {
        return view('contact.index');
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'topic' => ['nullable', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:5000'],
            'captcha_confirmed' => ['accepted'],
        ]);

        try {
            ContactInquiry::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'topic' => $validated['topic'] ?? 'General',
                'message' => $validated['message'],
            ]);

            return redirect()
                ->route('contact.index')
                ->with('success', 'Message submitted successfully. Our office will contact you soon.');
        } catch (QueryException $exception) {
            Log::error('Contact inquiry database error', ['error' => $exception->getMessage()]);
        } catch (\Throwable $exception) {
            Log::error('Contact inquiry submission failed', ['error' => $exception->getMessage()]);
        }

        return back()
            ->withInput()
            ->withErrors([
                'contact' => 'Your inquiry could not be submitted right now. Please try again shortly.',
            ]);
    }
}
