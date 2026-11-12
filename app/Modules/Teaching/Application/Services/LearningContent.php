<?php

namespace App\Modules\Teaching\Application\Services;

use App\Models\AcademicYear;
use App\Models\Student\AcademicOffering;
use App\Models\Student\AcademicResource;
use App\Models\Student\ContentSection;
use App\Models\User;
use App\Modules\Student\Application\Services\AcademicAccessService;
use App\Modules\Student\Application\Services\Audit;
use App\Notifications\LearningContentNotice;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

final class LearningContent
{
    public function __construct(private LearningAccess $access, private LearningFiles $files) {}

    public function create(AcademicOffering $offer, User $actor, array $input, ?UploadedFile $file = null, ?AcademicResource $source = null): AcademicResource
    {
        abort_unless($this->access->canManage($actor, $offer), 403);
        $this->assertKind($input['kind']);
        $facts = $file ? $this->files->inspect($file, $input['kind']) : [];
        $edition = Arr::only($input, ['title', 'body', 'url']);
        $placement = Arr::only($input, ['academic_content_section_id', 'academic_session_id', 'supplementary_for_id', 'position']);
        $hash = hash('sha256', json_encode([$actor->id, $offer->id, $input['kind'], $edition, $placement, $facts,
            $source?->id, $source ? ($input['source_version'] ?? null) : null, (bool) ($input['publish'] ?? false)], JSON_THROW_ON_ERROR));
        $written = null;
        try {
            return DB::transaction(function () use ($offer, $actor, $input, $file, $source, $facts, $edition, $placement, $hash, &$written) {
                $offer = $this->lockOffer($offer, $actor);
                if ($existing = AcademicResource::where('operation_key', $input['operation_key'])->first()) {
                    if ($existing->operation_hash !== $hash) {
                        throw ValidationException::withMessages(['operation_key' => 'Cette opération a déjà été utilisée avec un autre contenu.']);
                    }

                    return $existing;
                }
                if (($input['legacy_link'] ?? false) && $existing = $offer->resources()->whereNull('student_profile_id')
                    ->where('kind', 'online')->where(Arr::only($edition, ['title', 'url']))->first()) {
                    return $existing;
                }
                $this->checkPlacement($offer, $placement);
                if ($source) {
                    $source = AcademicResource::lockForUpdate()->findOrFail($source->id);
                    abort_unless($source->student_profile_id === null && $source->kind === $input['kind'] && $this->access->canManage($actor, $source->offering), 403);
                    $original = isset($input['source_version']) ? $source->versions()->where('number', $input['source_version'])->firstOrFail()->snapshot
                        : $source->only(AcademicResource::EDITION_FIELDS);
                    $edition = $edition + $original;
                    // Reuse pins the selected immutable file, and the new publication has its own access scope.
                }
                if ($file) {
                    $edition = array_replace($edition, $this->files->store($file, $facts, $written));
                }
                $this->checkPayload($input['kind'], $edition);
                $published = (bool) ($input['publish'] ?? false);
                $resource = $offer->resources()->create($placement + $edition + [
                    'kind' => $input['kind'], 'author_id' => $actor->id, 'disk' => 'local',
                    'operation_key' => $input['operation_key'], 'operation_hash' => $hash,
                    'revision' => 1, 'current_version' => 1, 'is_published' => $published, 'published_at' => $published ? now() : null,
                ]);
                $this->snapshot($resource, 1, $actor->id, $input['reason'] ?? null);
                Audit::record($actor->id, 'learning_content_created', $resource, $input['reason'] ?? null, ['reused_resource' => $source?->id, 'version' => 1]);
                if ($published && ($input['notify'] ?? false)) {
                    $this->notify($resource);
                }

                return $resource;
            });
        } catch (\Throwable $error) {
            if ($written !== null) {
                Storage::disk('local')->delete($written);
            }
            if ($error instanceof UniqueConstraintViolationException && AcademicResource::where('operation_key', $input['operation_key'])->exists()) {
                throw ValidationException::withMessages(['operation_key' => 'Cette opération a déjà été utilisée.']);
            }
            throw $error;
        }
    }

    public function edit(AcademicResource $resource, User $actor, array $input, ?UploadedFile $file): void
    {
        abort_unless($this->access->canManage($actor, $resource->offering), 403);
        $facts = $file ? $this->files->inspect($file, $resource->kind) : [];
        $written = null;
        try {
            DB::transaction(function () use ($resource, $actor, $input, $file, $facts, &$written) {
                $offer = $this->lockOffer($resource->offering, $actor);
                $resource = $offer->resources()->lockForUpdate()->findOrFail($resource->id);
                $this->assertResource($resource);
                $this->revision($resource->revision, $input['revision']);
                $placement = Arr::only($input, ['academic_content_section_id', 'academic_session_id', 'supplementary_for_id', 'position']);
                $this->checkPlacement($offer, $placement);
                $edition = Arr::only($input, ['title', 'body', 'url']);
                if ($file) {
                    $edition += $this->files->store($file, $facts, $written);
                }
                $this->checkPayload($resource->kind, $edition + $resource->only(AcademicResource::EDITION_FIELDS));
                $before = $resource->only(AcademicResource::EDITION_FIELDS);
                $resource->fill($placement + $edition);
                $newEdition = $resource->isDirty(AcademicResource::EDITION_FIELDS);
                if (! $resource->isDirty()) {
                    return;
                }
                if ($newEdition) {
                    if (! $resource->current_version) {
                        $resource->versions()->create(['number' => 1, 'snapshot' => $before, 'author_id' => $resource->author_id, 'reason' => 'Édition historique conservée.']);
                    }
                    $resource->current_version = ($resource->current_version ?? 1) + 1;
                    $resource->is_published = false;
                    $resource->published_at = null;
                }
                $resource->revision++;
                $resource->save();
                if ($newEdition) {
                    $this->snapshot($resource, $resource->current_version, $actor->id, $input['reason']);
                }
                Audit::record($actor->id, $newEdition ? 'learning_content_versioned' : 'learning_content_reordered', $resource, $input['reason'], ['version' => $resource->current_version]);
            });
        } catch (\Throwable $error) {
            if ($written !== null) {
                Storage::disk('local')->delete($written);
            }
            throw $error;
        }
    }

    public function transition(AcademicResource $resource, User $actor, array $input): void
    {
        DB::transaction(function () use ($resource, $actor, $input) {
            $offer = $this->lockOffer($resource->offering, $actor);
            $resource = $offer->resources()->lockForUpdate()->findOrFail($resource->id);
            $action = $input['action'];
            if (($action === 'archive' && $resource->archived_at)
                || ($action === 'publish' && $resource->is_published && ! $resource->archived_at)
                || ($action === 'withdraw' && ! $resource->is_published && ! $resource->archived_at)) {
                return;
            }
            $this->assertResource($resource);
            $this->revision($resource->revision, $input['revision']);
            if ($action === 'publish') {
                $this->checkPayload($resource->kind, $resource->only(AcademicResource::EDITION_FIELDS));
                if ($resource->path && $this->files->status($resource->only(AcademicResource::EDITION_FIELDS)) !== 'available') {
                    throw ValidationException::withMessages(['file' => 'Le fichier associé est indisponible. Remplacez-le avant publication.']);
                }
            }
            $resource->update([
                'is_published' => $action === 'publish', 'published_at' => $action === 'publish' ? now() : null,
                'archived_at' => $action === 'archive' ? now() : null, 'revision' => $resource->revision + 1,
            ]);
            Audit::record($actor->id, 'learning_content_'.$action, $resource, $input['reason'], ['version' => $resource->current_version]);
            if ($action === 'publish' && ($input['notify'] ?? false)) {
                $this->notify($resource);
            }
        });
    }

    public function saveSection(AcademicOffering $offer, User $actor, array $input, ?ContentSection $section = null): void
    {
        DB::transaction(function () use ($offer, $actor, $input, $section) {
            $offer = $this->lockOffer($offer, $actor);
            if ($section) {
                $section = ContentSection::where('academic_offering_id', $offer->id)->lockForUpdate()->findOrFail($section->id);
                $this->revision($section->revision, $input['revision']);
                $section->fill(Arr::only($input, ['title', 'position']));
                if (! $section->isDirty()) {
                    return;
                }
                $section->revision++;
                $section->save();
            } else {
                $section = ContentSection::create(Arr::only($input, ['title', 'position']) + ['academic_offering_id' => $offer->id]);
            }
            Audit::record($actor->id, 'learning_section_saved', $section);
        });
    }

    public function placeWork(AcademicResource $work, User $actor, array $input): void
    {
        DB::transaction(function () use ($work, $actor, $input) {
            $offer = $this->lockOffer($work->offering, $actor);
            $work = $offer->resources()->whereNull('student_profile_id')->whereIn('kind', ['assignment', 'evaluation'])->lockForUpdate()->findOrFail($work->id);
            if ($work->assessment()->exists()) {
                throw ValidationException::withMessages(['resource' => 'Organisez cette évaluation dans son brouillon.']);
            }
            $this->revision($work->revision, $input['revision']);
            $placement = Arr::only($input, ['academic_content_section_id', 'academic_session_id', 'position']);
            $this->checkPlacement($offer, $placement);
            $work->fill($placement);
            if ($work->isDirty()) {
                $work->revision++;
                $work->save();
                Audit::record($actor->id, 'learning_work_placed', $work, $input['reason']);
            }
        });
    }

    private function lockOffer(AcademicOffering $offer, User $actor): AcademicOffering
    {
        // Share the lock order used by teaching reassignment and the academic calendar.
        AcademicYear::orderBy('id')->lockForUpdate()->firstOrFail();
        $locked = AcademicOffering::lockForUpdate()->findOrFail($offer->id);
        abort_unless($this->access->canManage($actor, $locked), 403);

        return $locked;
    }

    private function assertKind(string $kind): void
    {
        if (! in_array($kind, AcademicResource::CONTENT_KINDS, true)) {
            throw ValidationException::withMessages(['kind' => 'Ce type relève du workflow des travaux ou des dossiers.']);
        }
    }

    private function assertResource(AcademicResource $resource): void
    {
        $this->assertKind($resource->kind);
        abort_if($resource->student_profile_id !== null, 404);
        if ($resource->archived_at) {
            throw ValidationException::withMessages(['resource' => 'L’archive est en lecture seule.']);
        }
    }

    private function revision(int $current, int|string $expected): void
    {
        if ($current !== (int) $expected) {
            throw ValidationException::withMessages(['revision' => 'Le contenu a changé. Rechargez avant de modifier.']);
        }
    }

    private function snapshot(AcademicResource $resource, int $number, int $author, ?string $reason): void
    {
        $resource->versions()->create(['number' => $number, 'snapshot' => $resource->only(AcademicResource::EDITION_FIELDS),
            'author_id' => $author, 'reason' => $reason]);
    }

    private function checkPlacement(AcademicOffering $offer, array $fields): void
    {
        $queries = [
            'academic_content_section_id' => ContentSection::where('academic_offering_id', $offer->id),
            'academic_session_id' => $offer->sessions(),
            'supplementary_for_id' => $offer->resources()->whereIn('kind', ['assignment', 'evaluation'])->whereNull('student_profile_id'),
        ];
        foreach ($queries as $key => $query) {
            if (isset($fields[$key]) && ! $query->whereKey($fields[$key])->exists()) {
                throw ValidationException::withMessages([$key => 'Choisissez une référence de cette offre de cours.']);
            }
        }
    }

    private function checkPayload(string $kind, array $edition): void
    {
        $hasFile = ! empty($edition['path']);
        $link = $edition['url'] ?? null;
        if ($link !== null && ! filter_var($link, FILTER_VALIDATE_URL)) {
            throw ValidationException::withMessages(['url' => 'Adresse externe invalide.']);
        }
        if ($link !== null && ! preg_match('#^https?://#i', $link)) {
            throw ValidationException::withMessages(['url' => 'Utilisez un lien HTTP ou HTTPS.']);
        }
        if (($kind === 'online' && (! $link || $hasFile))
            || (in_array($kind, ['audio', 'video'], true) && ! $link && ! $hasFile)
            || (! $hasFile && ! $link && empty($edition['body']))) {
            throw ValidationException::withMessages(['file' => 'Ajoutez un contenu, un fichier ou un lien adapté au type choisi.']);
        }
    }

    private function notify(AcademicResource $resource): void
    {
        $offer = $resource->offering;
        if (! $offer->is_published || ! AcademicResource::visible()->whereKey($resource->id)->exists()) {
            return;
        }
        $access = app(AcademicAccessService::class);
        app(CourseAudience::class)->roster($offer)->with(['profile.user', 'application', 'academicYear'])->chunkById(100, function ($rows) use ($access, $resource, $offer) {
            foreach ($rows as $entry) {
                if (! $access->decision($entry, 'courses_view')['allowed'] || ! $access->decision($entry, LearningAccess::fileFeature($resource))['allowed']
                    || ! $access->offerings($entry)->whereKey($offer->id)->exists()) {
                    continue;
                }
                $parent = LearningAccess::parentFeature($resource);
                if ($parent && ! $access->decision($entry, $parent)['allowed']) {
                    continue;
                }
                $section = match ($resource->kind) {
                    'online' => 'online',
                    'video' => 'videos',
                    default => 'files',
                };
                (new LearningContentNotice($entry->id, $offer->course_id, $section))->deliver($entry->profile->user);
            }
        });
    }
}
