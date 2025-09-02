<?php

namespace App\Services;

use App\Models\Enrollments;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EnrollmentService
{
    public function createDraft(array $data, User $user): Enrollments
    {
        return DB::transaction(function () use ($data, $user) {
            return Enrollments::create([
                'user_id'   => $user->id,
                'class_id'  => $data['class_id'],
                'public_id' => (string) Str::ulid(),
                'status'    => 'DRAFT',
                'answers'   => [],
            ]);
        });
    }

    public function updateDraft(Enrollments $enr, array $data): void
    {
        abort_unless($enr->status === 'DRAFT', 409, 'Dossier non éditable.');
        $patch = Arr::only($data, ['answers']);
        if (array_key_exists('answers', $patch)) {
            $enr->answers = array_replace_recursive($enr->answers ?? [], $patch['answers'] ?? []);
        }
        $enr->save();
    }

    public function submit(Enrollments $enr): void
    {
        abort_unless($enr->status === 'DRAFT', 409);

        // Exemple de revalidation (à adapter à tes admission_conditions):
        Validator::make($enr->toArray(), [
            // 'answers.address' => ['required','string','max:255'],
        ])->validate();

        DB::transaction(function () use ($enr) {
            $enr->update(['status' => 'SUBMITTED', 'submitted_at' => now()]);
            // event(new EnrollmentSubmitted($enr)); // si tu veux
        });
    }

    public function accept(Enrollments $enr): void
    {
        abort_unless(in_array($enr->status, ['SUBMITTED','UNDER_REVIEW']), 409);
        $class = $enr->class()->lockForUpdate()->first();
        $enrolled = $class->enrollments()->where('status', 'ENROLLED')->count();
        if ($class->capacity && $enrolled >= $class->capacity) {
            $enr->update(['status' => 'WAITLISTED', 'decided_at' => now()]);
            return;
        }
        $enr->update(['status' => 'ACCEPTED', 'decided_at' => now()]);
        // plus tard: paiement/présence => ENROLLED
    }
}