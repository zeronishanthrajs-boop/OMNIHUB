<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();
            $table->string('application_id', 20)->unique();
            $table->string('full_name');
            $table->date('dob');
            $table->string('gender', 20);
            $table->string('category', 30);
            $table->string('religion', 100)->nullable();
            $table->string('phone', 20);
            $table->string('email');
            $table->text('address');
            $table->string('school');
            $table->string('board', 120);
            $table->unsignedSmallInteger('pass_year');
            $table->string('subject_combo');
            $table->decimal('percentage', 5, 2);
            $table->string('pref1', 120);
            $table->string('pref2', 120);
            $table->string('pref3', 120);
            $table->string('doc_marksheet_path');
            $table->string('doc_tc_path');
            $table->string('doc_community_path')->nullable();
            $table->string('status', 30)->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admission_applications');
    }
};
