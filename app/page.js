import Menu from '../components/Menu';
import menu from '../data/menu.json';
export default function Page() { return <Menu categories={menu.categories} items={menu.items} />; }
