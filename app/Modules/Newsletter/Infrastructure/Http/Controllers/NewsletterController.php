<?php

namespace App\Modules\Newsletter\Infrastructure\Http\Controllers;

use App\Modules\Newsletter\Application\DTOs\NewsletterSubscriberDto;
use App\Modules\Newsletter\Application\UseCases\SubscribeToNewsletter;
use App\Modules\Newsletter\Application\UseCases\UnsubscribeFromNewsletter;
use App\Modules\Newsletter\Infrastructure\Http\Requests\SubscribeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsletterController
{
    public function __construct(
        private SubscribeToNewsletter $subscribeToNewsletter,
        private UnsubscribeFromNewsletter $unsubscribeFromNewsletter
    ) {}

    public function subscribe(SubscribeRequest $request): JsonResponse
    {
        $dto = new NewsletterSubscriberDto(
            id: null,
            email: $request->validated('email')
        );

        $subscriber = $this->subscribeToNewsletter->execute($dto);

        return response()->json([
            'message' => 'Merci de vous être abonné à notre newsletter !',
            'data' => [
                'email' => $subscriber->email,
                'subscribed_at' => $subscriber->subscribedAt?->format('Y-m-d H:i:s'),
            ]
        ], 201);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $success = $this->unsubscribeFromNewsletter->execute($request->input('email'));

        if (!$success) {
            return response()->json([
                'message' => 'Cette adresse email n\'est pas abonnée à notre newsletter.',
            ], 404);
        }

        return response()->json([
            'message' => 'Vous avez été désabonné de notre newsletter.',
        ]);
    }
}
