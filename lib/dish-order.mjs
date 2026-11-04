export function moveDish(items, id, delta) {
  const index=items.findIndex(item=>item.id===id);
  if(index<0 || ![-1,1,'top','bottom'].includes(delta)) return items;
  const category=items[index].category;
  if(delta==='top' || delta==='bottom') {
    const group=items.filter(item=>item.category===category);
    if((delta==='top' ? group[0] : group[group.length-1]).id===id) return items;
    const ordered=group.filter(item=>item.id!==id);
    if(delta==='top') ordered.unshift(items[index]); else ordered.push(items[index]);
    let position=0;
    return items.map(item=>item.category===category ? ordered[position++] : item);
  }
  let target=index+delta;
  while(target>=0 && target<items.length && items[target].category!==category) target+=delta;
  if(target<0 || target>=items.length) return items;
  const next=[...items];
  [next[index],next[target]]=[next[target],next[index]];
  return next;
}

export function changedDishOrders(base,draft) {
  return draft.categories.filter(category=>{
    const oldCategory=base.categories.find(old=>old.id===category.id);
    if(!oldCategory) return false;
    const before=base.items.filter(item=>item.category===oldCategory.name).map(item=>item.id);
    const after=draft.items.filter(item=>item.category===category.name).map(item=>item.id);
    const shared=new Set(before.filter(id=>after.includes(id)));
    return before.filter(id=>shared.has(id)).join('|')!==after.filter(id=>shared.has(id)).join('|');
  });
}

export function restoreDishOrder(base,items,category) {
  const previous=base.categories.find(old=>old.id===category.id);
  if(!previous) return items;
  const ranks=new Map(base.items.filter(item=>item.category===previous.name).map((item,index)=>[item.id,index]));
  const ordered=items.filter(item=>item.category===category.name).sort((a,b)=>(ranks.get(a.id)??Infinity)-(ranks.get(b.id)??Infinity));
  let index=0;
  return items.map(item=>item.category===category.name ? ordered[index++] : item);
}
