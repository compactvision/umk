import App from "@/components/layouts/Home/App";
import BlogpageSection from "@/components/section/blog/BlogpageSection";
import Breadcumb from "@/components/UI/home/Breadcumb";


export default function Blogpage() {
    return (
        <App>
            <Breadcumb title="Blog" desc="Latest News and Updates" />
            <BlogpageSection />
        </App>
    );
}