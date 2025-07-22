import React from 'react';

interface ErrorTextProps {
    readonly error?: string | string[];
}

export default function ErrorText({ error }: ErrorTextProps) {
    if (!error) return null;

    return (
        <span className="text-danger d-block mt-1 small">
            {Array.isArray(error) ? error.join(', ') : error}
        </span>
    );
}
