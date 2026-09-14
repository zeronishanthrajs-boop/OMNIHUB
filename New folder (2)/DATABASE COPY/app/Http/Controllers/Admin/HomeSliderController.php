<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSlider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class HomeSliderController extends Controller
{
    public function index(): View
    {
        try {
            if (!Schema::hasTable('home_sliders')) {
                return view('admin.home-sliders.index', ['sliders' => collect()]);
            }

            $orderColumn = Schema::hasColumn('home_sliders', 'order') ? 'order' : 'display_order';
            $sliders = HomeSlider::query()->orderBy($orderColumn)->orderByDesc('created_at')->get();

            return view('admin.home-sliders.index', compact('sliders'));
        } catch (\Throwable $exception) {
            report($exception);

            return view('admin.home-sliders.index', ['sliders' => collect()])
                ->with('error', 'Unable to load sliders right now.');
        }
    }

    public function store(Request $request)
    {
        try {
            if (!Schema::hasTable('home_sliders')) {
                return back()->withInput()->with('error', 'Home sliders table is missing. Please run migrations.');
            }

            $validated = $this->validateSlider($request, true);

            // Upload the file to the public disk so Storage::url(...) works in frontend/admin views.
            $path = $request->file('image')->store('sliders', 'public');
            if (!$path) {
                throw new \RuntimeException('Unable to store slider image on public disk.');
            }

            $payload = [
                'title' => $validated['title'] ?? null,
                'caption' => $validated['caption'] ?? null,
                'alt_text' => $validated['alt_text'] ?? null,
                'is_active' => (bool) ($validated['is_active'] ?? true),
                'image_path' => $path,
                'uploaded_by' => $request->user()?->id,
            ];

            if (Schema::hasColumn('home_sliders', 'display_order')) {
                $payload['display_order'] = $validated['display_order'] ?? 0;
            }

            if (Schema::hasColumn('home_sliders', 'subtitle')) {
                $payload['subtitle'] = $validated['subtitle'] ?? null;
            }

            if (Schema::hasColumn('home_sliders', 'order')) {
                $payload['order'] = $validated['order'] ?? ($validated['display_order'] ?? 0);
            }

            HomeSlider::create($payload);

            $storageLinked = is_link(public_path('storage')) || is_dir(public_path('storage'));
            if (!$storageLinked) {
                return back()->with('success', 'Homepage image uploaded. Run `php artisan storage:link` to render images publicly.');
            }

            return back()->with('success', 'Homepage image added successfully.');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            report($exception);

            return back()
                ->withInput()
                ->with('error', 'Failed to upload slider image. Please verify file type/size and storage configuration.');
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            if (!Schema::hasTable('home_sliders')) {
                return back()->withInput()->with('error', 'Home sliders table is missing. Please run migrations.');
            }

            $slide = HomeSlider::findOrFail($id);
            $validated = $this->validateSlider($request, false);

            $payload = [
                'title' => $validated['title'] ?? null,
                'caption' => $validated['caption'] ?? null,
                'alt_text' => $validated['alt_text'] ?? null,
                'is_active' => (bool) ($validated['is_active'] ?? false),
            ];

            if (Schema::hasColumn('home_sliders', 'display_order')) {
                $payload['display_order'] = $validated['display_order'] ?? 0;
            }

            if (Schema::hasColumn('home_sliders', 'subtitle')) {
                $payload['subtitle'] = $validated['subtitle'] ?? null;
            }

            if (Schema::hasColumn('home_sliders', 'order')) {
                $payload['order'] = $validated['order'] ?? ($validated['display_order'] ?? 0);
            }

            if ($request->hasFile('image')) {
                $newPath = $request->file('image')->store('sliders', 'public');
                if (!$newPath) {
                    throw new \RuntimeException('Unable to store updated slider image.');
                }

                if ($slide->image_path && Storage::disk('public')->exists($slide->image_path)) {
                    Storage::disk('public')->delete($slide->image_path);
                }

                $payload['image_path'] = $newPath;
            }

            $slide->update($payload);

            return back()->with('success', 'Homepage slider updated successfully.');
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            report($exception);

            return back()->withInput()->with('error', 'Failed to update slider. Please verify fields and image file.');
        }
    }

    public function destroy(int $id)
    {
        $slide = HomeSlider::findOrFail($id);

        if ($slide->image_path && Storage::disk('public')->exists($slide->image_path)) {
            Storage::disk('public')->delete($slide->image_path);
        }

        $slide->delete();

        return back()->with('success', 'Homepage image removed successfully.');
    }

    private function validateSlider(Request $request, bool $imageRequired): array
    {
        return $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:2000'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:0'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => [$imageRequired ? 'required' : 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);
    }
}
