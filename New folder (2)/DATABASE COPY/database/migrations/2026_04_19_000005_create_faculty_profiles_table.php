<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('designation', 120);
            $table->string('department', 120);
            $table->string('qualification', 150)->nullable();
            $table->string('specialization', 150)->nullable();
            $table->unsignedTinyInteger('experience_years')->default(0);
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('photo_path')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_profiles');
    }
};
