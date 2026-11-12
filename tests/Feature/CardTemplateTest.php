<?php

namespace Tests\Feature;

use App\Models\Student\CardTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CardTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authorized_administrator_can_create_and_edit_a_card_template(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Role::findOrCreate('admin', 'web'));
        $admin->givePermissionTo(Permission::findOrCreate('manage academic access', 'web'));
        $this->actingAs($admin);

        $prefix = 'dashboard.admin.card-templates.';
        $payload = [
            'name' => 'Modèle principal',
            'institution' => 'Université Simon Kimbangu',
            'heading' => 'Carte étudiante',
            'color' => '#16463a',
            'back_text' => 'Contacter le secrétariat.',
        ];

        $this->post(route($prefix.'store'), array_replace($payload, ['color' => 'invalid']))
            ->assertSessionHasErrors('color');
        $this->assertDatabaseCount('student_card_templates', 0);

        $response = $this->post(route($prefix.'store'), $payload)->assertSessionHasNoErrors();
        $template = CardTemplate::sole();
        $index = route($prefix.'index', ['template' => $template->id]);
        $response->assertRedirect($index);

        $this->put(route($prefix.'update', $template), array_replace($payload, ['color' => '#254d82', 'back_text' => null]))
            ->assertRedirect($index)->assertSessionHasNoErrors();

        $this->get($index)->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/cardTemplates/Index')
            ->where('selectedId', $template->id)
            ->has('templates', 1)
            ->where('templates.0.color', '#254d82')
            ->where('templates.0.back_text', null));
    }

    public function test_a_student_cannot_access_the_card_template_library(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard.admin.card-templates.index'))
            ->assertForbidden();
    }
}
