import { notFound } from 'next/navigation';
import menu from '../../../data/menu.json';
import FoodImage from '../../../components/FoodImage';
import DishHeader from '../../../components/DishHeader';
import Link from 'next/link';

export const dynamicParams = false;
export function generateStaticParams() { return menu.items.map(({ id }) => ({ id })); }
export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = menu.items.find(item => item.id === id);
  return { title: item ? `${item.name} | قراميش` : 'قراميش' };
}
export default async function DishPage({ params }) {
  const { id } = await params;
  const item = menu.items.find(item => item.id === id);
  if (!item) notFound();
  const related = menu.items.filter(dish => dish.category === item.category && dish.id !== item.id);
  return <div className="dish-view-shell">
    <main className="dish-detail">
      <div className="dish-detail-hero">
        <DishHeader />
        <div className="dish-detail-photo"><FoodImage src={item.image} alt={item.name} eager sizes="(max-width: 720px) 100vw, 720px" /></div>
      </div>
      <div className="dish-detail-content">
        <section className="dish-detail-overview" aria-labelledby="dish-name">
          <div className="dish-detail-title-row"><h1 id="dish-name"><span>{item.name}</span><svg className="heading-rays" viewBox="0 0 50 70" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m24 8 16 14M8 35h27M24 62l16-14" /></svg></h1><span className="dish-detail-badge">{item.category}</span></div>
          <div className="dish-detail-summary-row">
            <p>{item.shortDescription || item.description}</p>
            <p className="price"><bdi>{new Intl.NumberFormat('en-US').format(item.price)}</bdi> <span>د.ع</span></p>
          </div>
          {item.size && <p className="size">{item.size}</p>}
          {!item.available && <p className="dish-detail-unavailable">غير متوفر حالياً</p>}
          {(item.description || item.shortDescription) && <details className="dish-detail-description" key={item.id}><summary>وصف الطبق<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary><p>{item.description || item.shortDescription}</p></details>}
        </section>
        {related.length > 0 && <section className="related-dishes" aria-labelledby="related-heading" dir="rtl">
          <div className="related-dishes-heading"><h2 id="related-heading">قد يهمك أيضاً</h2></div>
          <ul className="related-dishes-track" aria-label="أطباق أخرى من نفس القسم" tabIndex={0} key={item.id}>
            {related.map(dish => {
              const Wrapper = dish.available ? Link : 'div';
              return <li key={dish.id} className={`related-dish${dish.available ? '' : ' related-dish-disabled'}`}>
              <Wrapper {...(dish.available ? { href: `/dish/${dish.id}`, replace: true } : { 'aria-disabled': true })} className="related-dish-link">
                <div className="related-dish-photo"><FoodImage src={dish.image} alt={dish.name} sizes="(max-width: 540px) 150px, 180px" />{dish.available && <span className="dish-photo-plus" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>}</div>
                <h3>{dish.name}</h3>
                <p className="price"><bdi>{new Intl.NumberFormat('en-US').format(dish.price)}</bdi> <span>د.ع</span></p>
              </Wrapper>
            </li>;
            })}
          </ul>
        </section>}
      </div>
      <div className="dish-detail-end-logo"><img className="footer-logo" src="/logo-badge.webp" alt="قراميش" width="320" height="320" loading="lazy" /></div>
    </main>
  </div>;
}
