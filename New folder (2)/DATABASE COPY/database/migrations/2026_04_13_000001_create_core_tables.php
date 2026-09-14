<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 15)->unique();
            $table->unsignedBigInteger('hod_faculty_id')->nullable();
            $table->longText('about')->nullable();
            $table->year('established_year')->nullable();
            $table->boolean('research_center')->default(false);
            $table->string('logo_path')->nullable();
            $table->timestamps();
        });

        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->enum('role', ['super_admin', 'dept_admin', 'faculty', 'student', 'public'])->default('public');
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->rememberToken();
                $table->timestamps();
            });
        } else {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'role')) {
                    $table->enum('role', ['super_admin', 'dept_admin', 'faculty', 'student', 'public'])->default('public');
                }

                if (!Schema::hasColumn('users', 'department_id')) {
                    $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                }

                if (!Schema::hasColumn('users', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });
        }

        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['UG', 'PG', 'Integrated']);
            $table->unsignedTinyInteger('duration_years');
            $table->unsignedInteger('total_seats')->default(0);
            $table->unsignedInteger('aided_seats')->default(0);
            $table->unsignedInteger('sf_seats')->default(0);
            $table->decimal('annual_fee_aided', 10, 2)->nullable();
            $table->decimal('annual_fee_sf', 10, 2)->nullable();
            $table->text('eligibility')->nullable();
            $table->string('syllabus_pdf')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('faculty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->string('designation');
            $table->string('qualification')->nullable();
            $table->string('specialization')->nullable();
            $table->unsignedTinyInteger('experience_years')->default(0);
            $table->string('photo_path')->nullable();
            $table->unsignedInteger('research_publications')->default(0);
            $table->longText('bio')->nullable();
            $table->boolean('is_hod')->default(false);
            $table->timestamps();
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->foreign('hod_faculty_id')->references('id')->on('faculty')->nullOnDelete();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('admission_number')->unique();
            $table->string('roll_number')->nullable();
            $table->foreignId('program_id')->constrained('programs')->cascadeOnDelete();
            $table->unsignedTinyInteger('semester')->default(1);
            $table->year('batch_year');
            $table->enum('category', ['General', 'SC', 'ST', 'OBC', 'Minority'])->default('General');
            $table->enum('aided_sf', ['Aided', 'Self-Financed'])->default('Aided');
            $table->string('phone', 20)->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('photo_path')->nullable();
            $table->boolean('hostel')->default(false);
            $table->timestamps();
        });

        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->string('applicant_name');
            $table->string('email');
            $table->string('phone', 20);
            $table->foreignId('program_id')->constrained('programs')->cascadeOnDelete();
            $table->decimal('plus_two_percentage', 5, 2);
            $table->enum('category', ['General', 'SC', 'ST', 'OBC', 'Minority'])->default('General');
            $table->string('documents_path')->nullable();
            $table->enum('status', ['pending', 'shortlisted', 'admitted', 'rejected'])->default('pending');
            $table->string('cap_allotment_id')->nullable();
            $table->timestamp('applied_at')->useCurrent();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('program_id')->constrained('programs')->cascadeOnDelete();
            $table->unsignedTinyInteger('semester');
            $table->string('subject_name');
            $table->decimal('internal_marks', 5, 2)->nullable();
            $table->decimal('external_marks', 5, 2)->nullable();
            $table->decimal('total_marks', 6, 2)->nullable();
            $table->decimal('max_marks', 6, 2)->nullable();
            $table->string('grade')->nullable();
            $table->enum('result_status', ['Pass', 'Fail', 'Absent', 'Withheld'])->default('Pass');
            $table->string('exam_month_year');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->longText('body');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->enum('category', ['exam', 'admission', 'general', 'event', 'scholarship'])->default('general');
            $table->string('attachment_path')->nullable();
            $table->foreignId('posted_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('event_date');
            $table->string('venue')->nullable();
            $table->enum('category', ['cultural', 'sports', 'academic', 'women_cell', 'nss'])->default('academic');
            $table->string('cover_image')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('placements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('company_name');
            $table->decimal('package_lpa', 5, 2);
            $table->string('role_offered');
            $table->year('placement_year');
            $table->string('offer_letter_path')->nullable();
            $table->timestamps();
        });

        Schema::create('gallery_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('title')->nullable();
            $table->string('type')->default('photo');
            $table->string('file_path');
            $table->year('year')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_items');
        Schema::dropIfExists('placements');
        Schema::dropIfExists('events');
        Schema::dropIfExists('notices');
        Schema::dropIfExists('results');
        Schema::dropIfExists('admissions');
        Schema::dropIfExists('students');
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['hod_faculty_id']);
        });
        Schema::dropIfExists('faculty');
        Schema::dropIfExists('programs');

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'department_id')) {
                    $table->dropConstrainedForeignId('department_id');
                }

                if (Schema::hasColumn('users', 'role')) {
                    $table->dropColumn('role');
                }

                if (Schema::hasColumn('users', 'is_active')) {
                    $table->dropColumn('is_active');
                }
            });
        }

        Schema::dropIfExists('departments');
    }
};
