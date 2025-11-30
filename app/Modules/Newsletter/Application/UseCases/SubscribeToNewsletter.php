<?php

namespace App\Modules\Newsletter\Application\UseCases;

use App\Modules\Newsletter\Application\DTOs\NewsletterSubscriberDto;
use App\Modules\Newsletter\Domain\Entities\NewsletterSubscriber;
use App\Modules\Newsletter\Domain\Repositories\NewsletterRepository;
use DateTimeImmutable;

class SubscribeToNewsletter
{
    public function __construct(
        private NewsletterRepository $repository
    ) {}

    public function execute(NewsletterSubscriberDto $dto): NewsletterSubscriberDto
    {
        // Check if email already exists
        $existing = $this->repository->findByEmail($dto->email);

        if ($existing) {
            // If exists but inactive, reactivate
            if (!$existing->isActive()) {
                $existing->activate();
                $saved = $this->repository->save($existing);
            } else {
                // Already subscribed and active
                $saved = $existing;
            }
        } else {
            // Create new subscriber
            $subscriber = new NewsletterSubscriber(
                id: null,
                email: $dto->email,
                isActive: true,
                subscribedAt: new DateTimeImmutable()
            );

            $saved = $this->repository->save($subscriber);
        }

        return new NewsletterSubscriberDto(
            id: $saved->id(),
            email: $saved->email(),
            isActive: $saved->isActive(),
            subscribedAt: $saved->subscribedAt(),
            unsubscribedAt: $saved->unsubscribedAt()
        );
    }
}
