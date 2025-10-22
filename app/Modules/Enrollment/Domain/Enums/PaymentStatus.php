<?php

namespace App\Modules\Enrollment\Domain\Enums;

enum PaymentStatus: string
{
    case UNPAID = 'unpaid';
    case PARTIAL = 'partial';
    case PAID = 'paid';
    case FREE = 'free';
}
