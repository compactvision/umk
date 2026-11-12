<?php

namespace App\Modules\LevelDetail\Infrastructure\Http\Requests;

use Illuminate\Validation\Validator;

trait ValidatesLevelInstallments
{
    private function installmentRules(): array
    {
        $rules = [];
        foreach (['national', 'foreign'] as $category) {
            foreach (['first' => 'second', 'second' => 'first'] as $part => $other) {
                $rules["price_{$category}_{$part}"] = ['nullable', "required_with:price_{$category}_{$other}", 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'];
            }
        }

        return $rules;
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            foreach (['national', 'foreign'] as $category) {
                $first = $this->input("price_{$category}_first");
                $second = $this->input("price_{$category}_second");
                if (preg_match('/^\d{1,9}(\.\d{1,2})?$/D', (string)$first) && preg_match('/^\d{1,9}(\.\d{1,2})?$/D', (string)$second) && \App\Modules\Student\Application\Services\Money::cents((string)$first) + \App\Modules\Student\Application\Services\Money::cents((string)$second) > 9999999999) {
                    $validator->errors()->add("price_{$category}_second", 'Le total des deux tranches ne peut pas dépasser 99 999 999,99 USD.');
                }
            }
        }];
    }
}
