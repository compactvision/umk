<?php

namespace App\Modules\Newsletter\Application\UseCases;

use App\Modules\Newsletter\Domain\Repositories\NewsletterRepository;

class UnsubscribeFromNewsletter
{
    public function __construct(
        private NewsletterRepository $repository
    ) {}

    public function execute(string $email): bool
    {
        $subscriber = $this->repository->findByEmail($email);

        if (!$subscriber) {
            return false;
        }

        if (!$subscriber->isActive()) {
            return true; // Already unsubscribed
        }

        $subscriber->deactivate();
        $this->repository->save($subscriber);

        return true;
    }
}
