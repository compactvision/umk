<?php

return [
    'http_log' => (bool) env('OPERATIONS_HTTP_LOG', false),
    'http_slow_ms' => (int) env('OPERATIONS_HTTP_SLOW_MS', 500),
];
