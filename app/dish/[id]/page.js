import { notFound } from 'next/navigation';
import menu from '../../../data/menu.json';
import DishContent from '../../../components/DishContent';
import { getPublishedMenu } from '../../../lib/published-menu';

export const dynamicParams = true;
export const revalidate = 60;
export function generateStaticParams() { return menu.items.map(({ id }) => ({ id })); }
export async function generateMetadata({ params }) {
  const { id } = await params;
  const { content } = await getPublishedMenu();
  const item = content.items.find(item => item.id === id);
  return { title: item ? `${item.name} | قراميش` : 'قراميش' };
}
export default async function DishPage({ params }) {
  const { id } = await params;
  const { content } = await getPublishedMenu();
  const item = content.items.find(item => item.id === id);
  if (!item) notFound();
  const related = content.items.filter(dish => dish.category === item.category && dish.id !== item.id);
  return <DishContent item={item} related={related}/>;
}
