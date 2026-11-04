export function moveToEdge(values,id,direction) {
  const index=values.findIndex(value=>value.id===id);
  if(index<0 || !['top','bottom'].includes(direction)) return values;
  if(index===(direction==='top' ? 0 : values.length-1)) return values;
  const next=values.filter(value=>value.id!==id);
  if(direction==='top') next.unshift(values[index]); else next.push(values[index]);
  return next;
}
