<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GalleryController extends Controller
{
    public function index()
    {
        $galleries = $this->loadGalleryItems();

        return view('gallery.index', compact('galleries'));
    }

    private function loadGalleryItems(): array
    {
        try {
            if (Schema::hasTable('gallery_items')) {
                $items = DB::table('gallery_items')
                    ->select(['title', 'file_path', 'category', 'year'])
                    ->where('is_published', true)
                    ->orderByDesc('year')
                    ->orderByDesc('id')
                    ->limit(24)
                    ->get()
                    ->map(function (object $item): array {
                        $filePath = (string) $item->file_path;
                        $src = str_starts_with($filePath, 'http')
                            ? $filePath
                            : asset('storage/' . ltrim($filePath, '/'));

                        return [
                            'title' => $item->title ?: 'Campus Moment',
                            'image' => $src,
                            'category' => strtolower((string) ($item->category ?: 'academic')),
                            'year' => (string) ($item->year ?: now()->year),
                        ];
                    })
                    ->values()
                    ->all();

                if (!empty($items)) {
                    return $items;
                }
            }
        } catch (\Throwable) {
            // Fallback data keeps gallery page stable if DB layer is unavailable.
        }

        return [
            ['title' => 'Graduation Ceremony - 2026', 'image' => asset('assets/images/gallery/college-graduation-1.jpeg'), 'category' => 'academic', 'year' => '2026'],
            ['title' => 'Campus Cultural Event - 2026', 'image' => asset('assets/images/gallery/college-graduation-2.jpeg'), 'category' => 'cultural', 'year' => '2026'],
            ['title' => 'Intercollegiate Sports - 2025', 'image' => asset('assets/images/gallery/college-event-1.jpeg'), 'category' => 'sports', 'year' => '2025'],
            ['title' => 'NSS Community Drive - 2025', 'image' => asset('assets/images/gallery/college-event-2.jpeg'), 'category' => 'nss', 'year' => '2025'],
            ['title' => 'Academic Gathering - 2025', 'image' => asset('assets/images/gallery/college-event-3.jpeg'), 'category' => 'academic', 'year' => '2025'],
            ['title' => 'Cultural Fest Evening - 2026', 'image' => asset('assets/images/gallery/college-event-4.jpeg'), 'category' => 'cultural', 'year' => '2026'],
        ];
    }
}
