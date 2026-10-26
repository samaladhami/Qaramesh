import FoodImage from './FoodImage';
import { memo } from 'react';
import Link from 'next/link';
const priceFormat = new Intl.NumberFormat('en-US');
function DishCard({ item, onOpen }) {
  return <article className={`dish-card ${!item.available ? 'unavailable' : ''}`} data-dish-category={item.category}>
    <div className="dish-photo"><FoodImage src={item.image} alt={item.name} />{!item.available && <span className="availability">غير متوفر حالياً</span>}</div>
    <div className="dish-content"><span className="dish-category">{item.category}</span><h3><Link className="dish-link" href={`/dish/${item.id}`} onClick={onOpen}>{item.name}</Link></h3><p className="dish-summary">{item.shortDescription || item.description || 'من قائمة قراميش'}</p>
      <div className="dish-bottom"><p className="price"><bdi>{priceFormat.format(item.price)}</bdi> <span>د.ع</span></p>{item.size && <span className="size">{item.size}</span>}</div>
    </div>
  </article>;
}
export default memo(DishCard);
