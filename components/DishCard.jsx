import FoodImage from './FoodImage';
const priceFormat = new Intl.NumberFormat('en-US');
export default function DishCard({ item }) {
  return <article className={`dish-card ${!item.available ? 'unavailable' : ''}`}>
    <div className="dish-photo"><FoodImage src={item.image} alt={item.name} />{!item.available && <span className="availability">غير متوفر حالياً</span>}</div>
    <div className="dish-content"><span className="dish-category">{item.category}</span><h3>{item.name}</h3><p className="dish-summary">{item.shortDescription || item.description || 'من قائمة قراميش'}</p>
      {item.description && item.description !== item.shortDescription && <details><summary>تفاصيل الطبق</summary><p>{item.description}</p></details>}
      <div className="dish-bottom"><p className="price"><bdi>{priceFormat.format(item.price)}</bdi> <span>د.ع</span></p>{item.size && <span className="size">{item.size}</span>}</div>
    </div>
  </article>;
}
