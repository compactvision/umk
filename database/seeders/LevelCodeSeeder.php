<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LevelCode;

class LevelCodeSeeder extends Seeder
{
    public function run(): void
    {
        $codes = [
            ['code' => 'L1', 'name' => 'Première Licence'],
            ['code' => 'L2', 'name' => 'Deuxième Licence'],
            ['code' => 'L3', 'name' => 'Troisième Licence'],
            ['code' => 'L4', 'name' => 'Quatrième Licence'],
            ['code' => 'M1', 'name' => 'Master 1'],
            ['code' => 'M2', 'name' => 'Master 2'],
            ['code' => 'D1', 'name' => 'Doctorat 1'],
            ['code' => 'D2', 'name' => 'Doctorat 2'],
        ];

        foreach ($codes as $code) {
            LevelCode::firstOrCreate(['code' => $code['code']], $code);
        }
    }
}
