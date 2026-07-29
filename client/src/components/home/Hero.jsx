import HeroBadge from "./hero/HeroBadge";
import HeroButtons from "./hero/HeroButtons";
import HeroDescription from "./hero/HeroDescription";
import HeroFeatures from "./hero/HeroFeatures";
import HeroSearch from "./hero/HeroSearch";
import HeroTitle from "./hero/HeroTitle";
import HeroProducts from "./hero/HeroProducts";

const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-indigo-50 via-white to-purple-50">
      <div className="mx-auto grid min-h-[720px] max-w-7xl grid-cols-1 items-center gap-20 px-6 py-20 lg:grid-cols-2">
        <div>
          <HeroBadge />

          <HeroTitle />

          <HeroDescription />

          <HeroSearch />

          <HeroButtons />

          <HeroFeatures />
        </div>

        <HeroProducts />
      </div>
    </section>
  );
};

export default Hero;
