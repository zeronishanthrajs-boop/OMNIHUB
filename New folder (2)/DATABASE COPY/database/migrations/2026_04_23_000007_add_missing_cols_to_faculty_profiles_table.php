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
            if (!Schema::hasColumn('faculty_profiles', 'bio')) {
                $table->text('bio')->nullable()->after('phone');
            }

            if (!Schema::hasColumn('faculty_profiles', 'experience')) {
                $table->string('experience', 120)->nullable()->after('specialization');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('faculty_profiles')) {
            return;
        }

        Schema::table('faculty_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('faculty_profiles', 'bio')) {
                $table->dropColumn('bio');
            }

            if (Schema::hasColumn('faculty_profiles', 'experience')) {
                $table->dropColumn('experience');
            }
        });
    }
};
