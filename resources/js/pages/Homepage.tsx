import App from "@/components/layouts/Home/App";
import Blog from "@/components/section/home/Blog";
import Courses from "@/components/section/home/Courses";
import Faculty from "@/components/section/home/Faculty";
import Fanfact from "@/components/section/home/Fanfact";
import Hero from "@/components/section/home/Hero";
import Campus from "@/components/section/home/Campus";
import Testimonial from "@/components/section/home/Testimonial";
import Event from "@/components/section/home/Event";

export default function Homepage() {
    return <App>
        <Hero />
        <Blog />
        <Faculty />
        {/* <Fanfact /> */}
        {/* <Courses /> */}
        <Campus />
        <Testimonial />
        <Event />
    </App>
}
