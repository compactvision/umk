import App from "@/components/layouts/Home/App";
import Blog from "@/components/section/home/Blog";
import Hero from "@/components/section/home/Hero";

export default function Welcome() {
    return <App>
        <Hero />
        <Blog />
    </App>
}
