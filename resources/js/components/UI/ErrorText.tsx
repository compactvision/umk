import React from 'react';

interface ErrorTextProps {
    readonly error?: string | string[];
}

export default function ErrorText({ error }: ErrorTextProps) {
    if (!error) return null;

    return (
        <>
            <span className="text-danger d-block mt-1 small">
                {Array.isArray(error) ? error.join(', ') : error}
            </span>

            <style>
                {`
                    .text-danger {
                        color: red;
                    }

                    .small {
                        font-size: 0.8rem;
                    }

                    .d-block {
                        display: block;
                    }

                    .mt-1 {
                        margin-top: 0.25rem;
                    }
                `}
            </style>
        
        </>
    );
}
