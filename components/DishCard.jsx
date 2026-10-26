import FoodImage from './FoodImage';
import { memo } from 'react';
import Link from 'next/link';
const priceFormat = new Intl.NumberFormat('en-US');
function DishCard({ item, onOpen }) {
  return <article className={`dish-card ${!item.available ? 'unavailable' : ''}`} data-dish-category={item.category}>
    <div className="dish-photo"><FoodImage src={item.image} alt={item.name} />{item.available && <span className="dish-photo-plus" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>}{!item.available && <span className="availability">غير متوفر حالياً</span>}</div>
    <div className="dish-content"><span className="dish-category">{item.category}</span><h3>{item.available ? <Link className="dish-link" href={`/dish/${item.id}`} onClick={onOpen}>{item.name}</Link> : <span aria-disabled="true">{item.name}</span>}</h3><p className="dish-summary">{item.shortDescription || item.description || 'من قائمة قراميش'}</p>
      <div className="dish-bottom"><p className="price"><bdi>{priceFormat.format(item.price)}</bdi> <span>د.ع</span></p>{item.size && <span className="size">{item.size}</span>}</div>
    </div>
  </article>;
}
export default memo(DishCard);
