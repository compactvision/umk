import Header from "@/components/common/Header/Header";
import Blog from "@/components/section/home/Blog";
import Hero from "@/components/section/home/Hero";

export default function Welcome() {
    return (
        <>
          <Header/>  
          <main>
              <Hero/>
              <Blog/>
          </main>
        </>
    );
}
