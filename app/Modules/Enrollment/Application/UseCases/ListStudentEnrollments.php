<?php

namespace App\Modules\Enrollment\Application\UseCases;

use App\Modules\Enrollment\Application\DTO\ListStudentEnrollmentsQuery;
use App\Modules\Enrollment\Domain\Repositories\EnrollmentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListStudentEnrollments
{
    public function __construct(private EnrollmentRepository $repo) {}

    public function handle(ListStudentEnrollmentsQuery $query): LengthAwarePaginator
    {
        $filters = [
            'statuses'   => $query->statuses,
            'level_id'   => $query->levelId,
            'from'       => $query->from,
            'to'         => $query->to,
            'search'     => $query->search,
            'date_field' => $query->dateField,
            'order_by'   => $query->orderBy,
            'order_dir'  => $query->orderDir,
        ];

        return $this->repo->paginateByStudent(
            studentId: $query->studentId,
            filters:   $filters,
            perPage:   $query->perPage,
            page:      $query->page
        );
    }
}
