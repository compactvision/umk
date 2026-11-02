import { Head, usePage } from '@inertiajs/react';
export type SeoData = {
    title: string;
    description: string;
    canonical: string;
    robots: string;
    image: string;
    type: string;
    schema: object;
    verification?: string | null;
};
export default function Seo() {
    const { seo } = usePage<{ seo?: SeoData }>().props;
    if (!seo) return null;
    return (
        <Head title={seo.title}>
            <meta head-key="description" name="description" content={seo.description} />
            <link head-key="canonical" rel="canonical" href={seo.canonical} />
            <meta head-key="robots" name="robots" content={seo.robots} />
            <meta head-key="og:locale" property="og:locale" content="fr_CD" />
            <meta head-key="og:site_name" property="og:site_name" content="Université Simon Kimbangu" />
            <meta head-key="og:title" property="og:title" content={seo.title} />
            <meta head-key="og:description" property="og:description" content={seo.description} />
            <meta head-key="og:url" property="og:url" content={seo.canonical} />
            <meta head-key="og:type" property="og:type" content={seo.type} />
            <meta head-key="og:image" property="og:image" content={seo.image} />
            <meta head-key="og:image:alt" property="og:image:alt" content="Université Simon Kimbangu" />
            <meta head-key="twitter:card" name="twitter:card" content="summary_large_image" />
            <meta head-key="twitter:title" name="twitter:title" content={seo.title} />
            <meta head-key="twitter:description" name="twitter:description" content={seo.description} />
            <meta head-key="twitter:image" name="twitter:image" content={seo.image} />
            {seo.verification && <meta head-key="google-verification" name="google-site-verification" content={seo.verification} />}
            <script head-key="structured-data" type="application/ld+json">
                {JSON.stringify(seo.schema).replace(/</g, '\\u003c')}
            </script>
        </Head>
    );
}
