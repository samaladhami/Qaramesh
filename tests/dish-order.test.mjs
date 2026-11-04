import test from 'node:test';
import assert from 'node:assert/strict';
import {moveDish,changedDishOrders,restoreDishOrder} from '../lib/dish-order.mjs';
import {moveToEdge} from '../lib/list-order.mjs';

const base={categories:[{id:'a',name:'A'},{id:'b',name:'B'}],items:[{id:'a1',category:'A',price:1},{id:'b1',category:'B'},{id:'a2',category:'A',price:2},{id:'b2',category:'B'},{id:'a3',category:'A',price:3}]};
test('offer first/last moves preserve the other images and handle list boundaries',()=>{
  const slides=[{id:'one',src:'first'},{id:'two',src:'second'},{id:'three',src:'third'}];
  assert.deepEqual(moveToEdge(slides,'three','top').map(slide=>slide.id),['three','one','two']);
  assert.deepEqual(moveToEdge(slides,'one','bottom').map(slide=>slide.id),['two','three','one']);
  assert.equal(moveToEdge(slides,'one','top'),slides);
  assert.equal(moveToEdge(slides,'three','bottom'),slides);
  assert.equal(moveToEdge(slides,'missing','top'),slides);
  assert.deepEqual(slides.map(slide=>slide.src),['first','second','third']);
});
test('dish moves respect category boundaries and leave other categories in place',()=>{
  const items=moveDish(base.items,'a2',-1);
  assert.deepEqual(items.map(i=>i.id),['a2','b1','a1','b2','a3']);
  assert.deepEqual(base.items.map(i=>i.id),['a1','b1','a2','b2','a3']);
  assert.equal(moveDish(base.items,'a1',-1),base.items);
  assert.equal(moveDish(base.items,'a3',1),base.items);
  assert.deepEqual(moveDish(items,'a2',1),base.items);
  assert.deepEqual(changedDishOrders(base,{...base,items}).map(c=>c.id),['a']);
});
test('order undo preserves edits, new dishes, deletions and renamed categories',()=>{
  const draft={categories:[{id:'a',name:'Renamed'},{id:'b',name:'B'}],items:moveDish(base.items,'a3',-1).filter(i=>i.id!=='a1').map(i=>i.category==='A'?{...i,category:'Renamed',price:99}:i)};
  draft.items.push({id:'new',category:'Renamed',price:10});
  assert.equal(changedDishOrders(base,draft).length,1);
  const items=restoreDishOrder(base,draft.items,draft.categories[0]);
  assert.deepEqual(items.filter(i=>i.category==='Renamed').map(i=>i.id),['a2','a3','new']);
  assert.equal(items.find(i=>i.id==='a2').price,99);
  assert.equal(changedDishOrders(base,{...draft,items}).length,0);
  assert.equal(changedDishOrders(base,{...base,items:base.items.filter(i=>i.id!=='a1')}).length,0);
});

test('jumping to category top or bottom preserves all other relative ordering',()=>{
  const top=moveDish(base.items,'a3','top');
  assert.deepEqual(top.map(item=>item.id),['a3','b1','a1','b2','a2']);
  const bottom=moveDish(base.items,'a1','bottom');
  assert.deepEqual(bottom.map(item=>item.id),['a2','b1','a3','b2','a1']);
  assert.equal(moveDish(base.items,'a1','top'),base.items);
  assert.equal(moveDish(base.items,'a3','bottom'),base.items);
  assert.equal(moveDish(base.items,'unknown','top'),base.items);
  assert.deepEqual(restoreDishOrder(base,top,base.categories[0]),base.items);
});
