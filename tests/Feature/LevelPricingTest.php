<?php

namespace Tests\Feature;

use App\Models\LevelDetail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LevelPricingTest extends TestCase
{
    use RefreshDatabase;

    public function test_national_and_foreign_prices_are_independent_and_publicly_available(): void
    {
        $admin = new User;
        $admin->forceFill(['first_name' => 'Test', 'last_name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password', 'email_verified_at' => now()])->save();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR', 'is_active' => true]);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1', 'is_active' => true]);
        $detail = LevelDetail::create(['level_id' => $level, 'price' => 405, 'fees' => 0]);
        $payload = ['level_id' => $level, 'price' => 405.50, 'price_foreign' => 605.75, 'duration_years' => 1, 'fees' => 0, 'has_certificate' => false];
        $url = '/dashboard/admin/levels/details/'.$detail->id;
        $this->actingAs($admin)->put($url, $payload)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('level_details', ['id' => $detail->id, 'price' => 405.50, 'price_foreign' => 605.75]);
        $this->get('/dashboard/admin/levels/details/'.$level)->assertOk()->assertInertia(fn (Assert $page) => $page->where('levelDetail.price', 405.5)->where('levelDetail.price_foreign', 605.75));
        $this->get('/course/'.$level)->assertOk()->assertInertia(fn (Assert $page) => $page->where('course.detail.price', fn ($price) => (float) $price === 405.5)->where('course.detail.price_foreign', fn ($price) => (float) $price === 605.75));

        unset($payload['price_foreign']);
        $payload['language'] = 'Français';
        $this->put($url, $payload)->assertSessionHasNoErrors();
        $this->assertEquals(605.75, $detail->fresh()->price_foreign);
        $payload['price_foreign'] = null;
        $this->put($url, $payload)->assertSessionHasNoErrors();
        $this->assertNull($detail->fresh()->price_foreign);
        $this->assertEquals(405.5, $detail->fresh()->price);

        foreach (['price', 'price_foreign'] as $field) {
            $this->put($url, array_merge($payload, [$field => -5]))->assertSessionHasErrors($field);
            $this->put($url, array_merge($payload, [$field => '12.345']))->assertSessionHasErrors($field);
        }
    }

    public function test_two_installments_compute_authoritative_totals_and_validate_complete_pairs(): void
    {
        $admin = new User;
        $admin->forceFill(['first_name' => 'Test', 'last_name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password', 'email_verified_at' => now()])->save();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $faculty = DB::table('faculties')->insertGetId(['name' => 'Droit', 'code' => 'DR', 'is_active' => true]);
        $level = DB::table('levels')->insertGetId(['faculty_id' => $faculty, 'title' => 'Licence 1', 'code' => 'L1', 'is_active' => true]);
        $detail = LevelDetail::create(['level_id' => $level, 'price' => 405, 'price_foreign' => 605, 'fees' => 0]);
        $payload = ['level_id' => $level, 'duration_years' => 1, 'fees' => 0, 'price' => 1, 'price_foreign' => 2,
            'price_national_first' => '250.10', 'price_national_second' => '155.20',
            'price_foreign_first' => '370.35', 'price_foreign_second' => '235.45'];
        $url = '/dashboard/admin/levels/details/'.$detail->id;
        $this->actingAs($admin)->put($url, $payload)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('level_details', ['id' => $detail->id, 'price' => 405.30, 'price_foreign' => 605.80, 'price_national_first' => 250.10, 'price_foreign_second' => 235.45]);
        $this->get('/course/'.$level)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('course.detail.price', fn ($value) => (float) $value === 405.3)
            ->where('course.detail.price_foreign', fn ($value) => (float) $value === 605.8)
            ->where('course.detail.price_national_first', fn ($value) => (float) $value === 250.1));
        $this->put($url, array_merge($payload, ['price_national_second' => null]))->assertSessionHasErrors('price_national_second');
        $this->put($url, array_merge($payload, ['price_foreign_first' => '-1']))->assertSessionHasErrors('price_foreign_first');
        $this->put($url, array_merge($payload, ['price_national_first' => '0.001']))->assertSessionHasErrors('price_national_first');
        $this->put($url, array_merge($payload, ['price_national_first' => 99999999, 'price_national_second' => 99999999]))->assertSessionHasErrors('price_national_second');
        foreach (['price_national_first', 'price_national_second', 'price_foreign_first', 'price_foreign_second'] as $field) {
            $payload[$field] = null;
        }
        $this->put($url, $payload)->assertSessionHasNoErrors();
        $this->assertEquals(405.3, $detail->fresh()->price);
        $this->assertEquals(605.8, $detail->fresh()->price_foreign);
        $this->assertNull($detail->fresh()->price_national_first);
        $payload['price_national_first'] = 0;
        $payload['price_national_second'] = 0;
        $this->put($url, $payload)->assertSessionHasNoErrors();
        $this->assertEquals(0, $detail->fresh()->price);
    }
}
