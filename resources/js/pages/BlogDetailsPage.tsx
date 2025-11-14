import App from "@/components/layouts/Home/App";
import BlogDetailsSection from "@/components/section/blog/BlogDetailsSection";
import Breadcumb from "@/components/UI/home/Breadcumb";
import { usePage } from "@inertiajs/react";


export default function BlogDetailsPage() {
    const { props } = usePage()

    const { post, categories } = props
    return (
        <App>
            <Breadcumb title={post.title} desc="Dernières nouvelles et mises à jour" />
            <BlogDetailsSection post={post} categories={categories} />
        </App>
    );
}