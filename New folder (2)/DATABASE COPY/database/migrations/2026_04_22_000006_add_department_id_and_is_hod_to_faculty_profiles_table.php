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
            if (!Schema::hasColumn('faculty_profiles', 'department_id')) {
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            }

            if (!Schema::hasColumn('faculty_profiles', 'is_hod')) {
                $table->boolean('is_hod')->default(false)->after('is_active');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('faculty_profiles')) {
            return;
        }

        Schema::table('faculty_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('faculty_profiles', 'department_id')) {
                $table->dropConstrainedForeignId('department_id');
            }

            if (Schema::hasColumn('faculty_profiles', 'is_hod')) {
                $table->dropColumn('is_hod');
            }
        });
    }
};
