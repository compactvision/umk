<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\LevelDetail;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdmissionPricingSeeder extends Seeder
{
    /** Ordinary academic fees in USD, admissions page 2026–2027 (resources/js/lib/admissions.ts).
     *  Faculty-wide amounts applied to each existing level at the user's request.
     *  Ancillary fees and special enrollment plans are separate and are not imported here.
     */
    public const PLANS = [
        'MED' => [450, 353, 650, 553],
        'SP' => [270, 185, 370, 235],
        'SSPA' => [250, 155, 370, 235],
        'DR' => [250, 155, 370, 235],
        'THEO' => [250, 155, 370, 235],
    ];

    public function run(): void
    {
        $faculties = Faculty::with('levels')->whereIn('code', array_keys(self::PLANS))->get();
        foreach (array_keys(self::PLANS) as $code) {
            if (! $faculties->contains('code', $code)) {
                throw new \RuntimeException("Faculté {$code} absente : importez d’abord les facultés de la landing.");
            }
        }
        $count = 0;
        DB::transaction(function () use ($faculties, &$count) {
            foreach ($faculties as $faculty) {
                [$nationalFirst, $nationalSecond, $foreignFirst, $foreignSecond] = self::PLANS[$faculty->code];
                foreach ($faculty->levels as $level) {
                    LevelDetail::updateOrCreate(['level_id' => $level->id], [
                        'price_national_first' => $nationalFirst,
                        'price_national_second' => $nationalSecond,
                        'price' => $nationalFirst + $nationalSecond,
                        'price_foreign_first' => $foreignFirst,
                        'price_foreign_second' => $foreignSecond,
                        'price_foreign' => $foreignFirst + $foreignSecond,
                    ]);
                    $count++;
                }
            }
        });
        $this->command?->info("Barème admissions 2026–2027 appliqué à {$count} niveau(x), hors frais annexes.");
    }
}
