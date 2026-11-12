<?php

return [
    'queue_notices' => (bool) env('LEARNING_CONTENT_QUEUE_NOTICES', false),
    'direct_s3_downloads' => (bool) env('LEARNING_CONTENT_DIRECT_S3_DOWNLOADS', false),
];
