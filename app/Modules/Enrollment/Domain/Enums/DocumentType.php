<?php
// app/Modules/Enrollment/Domain/Enums/DocumentType.php

namespace App\Modules\Enrollment\Domain\Enums;

enum DocumentType: string
{
    case ID_CARD = 'id_card';
    case PHOTO = 'photo';
    case DIPLOMA = 'diploma';
    case TRANSCRIPT = 'transcript';
    case BIRTH_CERTIFICATE = 'birth_certificate';
    case RECOMMENDATION_LETTER = 'recommendation_letter';
    case OTHER = 'other';

    public function label(): string
    {
        return match($this) {
            self::ID_CARD => 'Pièce d\'identité',
            self::PHOTO => 'Photo d\'identité',
            self::DIPLOMA => 'Diplôme',
            self::TRANSCRIPT => 'Relevé de notes',
            self::BIRTH_CERTIFICATE => 'Acte de naissance',
            self::RECOMMENDATION_LETTER => 'Lettre de recommandation',
            self::OTHER => 'Autre document',
        };
    }

    public function isRequired(): bool
    {
        return in_array($this, [
            self::ID_CARD,
            self::PHOTO,
            self::DIPLOMA,
            self::TRANSCRIPT,
        ]);
    }

    public function acceptedMimeTypes(): array
    {
        return match($this) {
            self::PHOTO => ['image/jpeg', 'image/png'],
            self::ID_CARD, 
            self::DIPLOMA, 
            self::TRANSCRIPT, 
            self::BIRTH_CERTIFICATE => ['image/jpeg', 'image/png', 'application/pdf'],
            self::RECOMMENDATION_LETTER => ['application/pdf'],
            self::OTHER => ['image/jpeg', 'image/png', 'application/pdf'],
        };
    }
}