import HeroCarousel from './HeroCarousel';
import slides from '../data/hero-slides.json';

export default function RestaurantHeader() {
  return (
    <header className="restaurant-header relative isolate overflow-hidden">
      <HeroCarousel slides={slides} />
      <h1 className="sr-only">مطعم قراميش</h1>
    </header>
  );
}
