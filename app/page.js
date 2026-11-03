import Menu from '../components/Menu';
import { getPublishedMenu } from '../lib/published-menu';
export const revalidate = 60;
export default async function Page() {
  const { content } = await getPublishedMenu();
  return <Menu categories={content.categories.map(c=>c.name)} categoryRecords={content.categories} items={content.items} slides={content.slides}/>;
}
