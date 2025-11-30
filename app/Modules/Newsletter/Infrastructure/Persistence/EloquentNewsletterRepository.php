<?php

namespace App\Modules\Newsletter\Infrastructure\Persistence;

use App\Models\NewsletterSubscriber as EloquentNewsletterSubscriber;
use App\Modules\Newsletter\Domain\Entities\NewsletterSubscriber;
use App\Modules\Newsletter\Domain\Repositories\NewsletterRepository;
use DateTimeImmutable;

class EloquentNewsletterRepository implements NewsletterRepository
{
    public function save(NewsletterSubscriber $subscriber): NewsletterSubscriber
    {
        $model = $subscriber->id()
            ? EloquentNewsletterSubscriber::findOrFail($subscriber->id())
            : new EloquentNewsletterSubscriber();

        $model->fill([
            'email' => $subscriber->email(),
            'is_active' => $subscriber->isActive(),
            'subscribed_at' => $subscriber->subscribedAt(),
            'unsubscribed_at' => $subscriber->unsubscribedAt(),
        ]);
        
        $model->save();

        return $this->mapToEntity($model);
    }

    public function findByEmail(string $email): ?NewsletterSubscriber
    {
        $model = EloquentNewsletterSubscriber::where('email', $email)->first();

        return $model ? $this->mapToEntity($model) : null;
    }

    public function getAllActive(): array
    {
        $models = EloquentNewsletterSubscriber::where('is_active', true)->get();

        return $models->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    private function mapToEntity(EloquentNewsletterSubscriber $model): NewsletterSubscriber
    {
        return new NewsletterSubscriber(
            $model->id,
            $model->email,
            $model->is_active,
            $model->subscribed_at ? new DateTimeImmutable($model->subscribed_at) : null,
            $model->unsubscribed_at ? new DateTimeImmutable($model->unsubscribed_at) : null
        );
    }
}
