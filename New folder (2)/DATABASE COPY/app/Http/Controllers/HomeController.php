<?php

namespace App\Http\Controllers;

use App\Models\HomeSlider;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class HomeController extends Controller
{
    public function index()
    {
        $slides = $this->getActiveSlides();

        $testimonials = [
            [
                'name' => 'Anu Mathew',
                'program' => 'B.Sc. Physics (2023-26)',
                'quote' => 'The Physics department mentoring and lab exposure gave me the confidence to pursue research-oriented higher studies.',
            ],
            [
                'name' => 'Niyas P. M.',
                'program' => 'BCA (2022-25)',
                'quote' => 'From placement preparation to coding practice, the faculty support here made my transition to the IT industry smooth.',
            ],
            [
                'name' => 'Riya George',
                'program' => 'M.Sc. Food Science (2024-26)',
                'quote' => 'Hands-on training, seminars, and project guidance helped me build strong technical and professional skills.',
            ],
        ];

        return view('home', compact('slides', 'testimonials'));
    }

    private function getActiveSlides(): Collection
    {
        try {
            if (!Schema::hasTable('home_sliders')) {
                return collect();
            }

            return HomeSlider::active()
                ->orderBy('display_order')
                ->orderByDesc('created_at')
                ->get();
        } catch (\Throwable) {
            return collect();
        }
    }
}
