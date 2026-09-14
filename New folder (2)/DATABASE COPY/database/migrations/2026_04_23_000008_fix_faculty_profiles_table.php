<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('faculty_profiles')) {
            return;
        }

        Schema::table('faculty_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('faculty_profiles', 'photo')) {
                $table->string('photo')->nullable()->after('is_hod');
            }

            if (!Schema::hasColumn('faculty_profiles', 'bio')) {
                $table->text('bio')->nullable()->after('phone');
            }

            if (!Schema::hasColumn('faculty_profiles', 'experience')) {
                $table->string('experience', 255)->nullable()->after('qualification');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('faculty_profiles')) {
            return;
        }

        Schema::table('faculty_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('faculty_profiles', 'photo')) {
                $table->dropColumn('photo');
            }
        });
    }
};
