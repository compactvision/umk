<?php

namespace App\Modules\Enrollment\Domain\Enums;

enum EnrollmentStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case IN_REVIEW = 'in_review';
    case PENDING_DOCUMENTS = 'pending_documents';
    case VALIDATED = 'validated';
    case REJECTED = 'rejected';
    case ARCHIVED = 'archived';
}
