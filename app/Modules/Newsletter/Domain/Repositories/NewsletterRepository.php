<?php

namespace App\Modules\Newsletter\Domain\Repositories;

use App\Modules\Newsletter\Domain\Entities\NewsletterSubscriber;

interface NewsletterRepository
{
    public function save(NewsletterSubscriber $subscriber): NewsletterSubscriber;
    
    public function findByEmail(string $email): ?NewsletterSubscriber;
    
    public function getAllActive(): array;
}
