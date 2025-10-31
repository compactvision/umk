import App from "@/components/layouts/Home/App";
import BlogDetailsSection from "@/components/section/blog/BlogDetailsSection";
import Breadcumb from "@/components/UI/home/Breadcumb";


export default function BlogDetailsPage() {
    return (
        <App>
            <Breadcumb title="Blog Vu" desc="Latest News and Updates" />
            <BlogDetailsSection />
        </App>
    );
}