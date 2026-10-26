const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
class FakeElement {
  constructor(id='') {
    this.id=id; this.children=[]; this.value=''; this.textContent=''; this.dataset={};
    this.disabled=false; this.hidden=false; this.onclick=null;this.listeners={};
    const tokens=new Set();
    this.classList={toggle:(s, b)=> {if(b===undefined ? !tokens.has(s) : b)tokens.add(s);else tokens.delete(s)}, add:(s)=>tokens.add(s),contains:(s)=>tokens.has(s)};
  }
  append(...items){this.children.push(...items)}
  appendChild(item){this.children.push(item);return item}
  replaceChildren(...items){this.children=items}
  addEventListener(name,fn){this.listeners[name]=fn}
  setAttribute(name,value){this[name]=value}
}
const ids=new Map();
const e=id=>{if(!ids.has(id))ids.set(id,new FakeElement(id));return ids.get(id)};
const queue=[];
const document={getElementById:e,createElement:()=>new FakeElement(),createTextNode:(x)=>({textContent:x}),querySelectorAll:(selector)=>selector==='.view'?[e('home'),e('journey'),e('sim'),e('book'),e('reels')]:[]};
const sandbox={document,window:{scrollTo:()=>{}},setTimeout:(fn)=>queue.push(fn),console};
const html=fs.readFileSync(__dirname+'/../experiments/flow-prototype-audited.html','utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inline, 'インラインスクリプトがない');
const code=inline[1]+'\n globalThis.__probe={simModel,drawSim,betSim,leverSim,stopSim,enterPhase,go};';
vm.runInNewContext(code,sandbox,{filename:'prototype.js'});
const s=sandbox.__probe.simModel;
async function spin(){const p=e('simSpin').onclick();while(queue.length)queue.shift()();await p;}
async function main(){
 assert.equal(s.phase,'normal');
 assert.equal(e('simSpin').disabled,false);
 await spin();assert.equal(s.g,1);assert.equal(s.coins,97);assert.equal(s.total,1);
 await spin();assert.equal(s.phase,'cz');assert.equal(s.total,2);assert.match(e('simResult').textContent,/チェリー/);assert.match(e('simResult').textContent,/払出 2枚/);assert.equal(s.coins,96);
 assert.match(e('simSpin').textContent,/1G/);
 await spin();await spin();assert.equal(s.pending,'cz');assert.equal(e('simSpin').disabled,true);
 e('simDecision').children[1].onclick();assert.equal(s.phase,'normal');
 await spin();await spin();assert.equal(s.phase,'cz');
 await spin();await spin();assert.equal(s.pending,'cz');
 e('simDecision').children[0].onclick();assert.equal(s.phase,'at');
 await spin();await spin();await spin();assert.equal(s.phase,'end');assert.match(e('simResult').textContent,/スイカ/);assert.match(e('simResult').textContent,/払出 3枚/);
 await spin();assert.equal(s.phase,'return');
 await spin();await spin();assert.equal(s.pending,'return');
 e('simDecision').children[0].onclick();assert.equal(s.phase,'at');
 e('simReset').onclick(); e('simBet').onclick(); assert.equal(s.cycle,'bet');
 assert.match(e('simSpin').textContent,/最後まで/);await spin();assert.equal(s.total,1);assert.equal(s.cycle,'ready');
 e('simBet').onclick();e('simLever').onclick();e('simStop0').onclick();assert.equal(s.cycle,'spin');
 await spin();assert.equal(s.total,2);assert.equal(s.phase,'cz');
 e('simReset').onclick();s.coins=0;s.freeBet=false;sandbox.__probe.drawSim();
 assert.equal(e('simSpin').disabled,true);
 assert.equal(s.total,0);assert.equal(s.cycle,'ready');
 e('simReset').onclick();const oldSpin=e('simSpin').onclick();assert.equal(s.busy,true);
 e('simReset').onclick();assert.equal(s.total,0);assert.equal(s.coins,100);
 while(queue.length)queue.shift()();await oldSpin;
 assert.equal(s.total,0);assert.equal(s.coins,100);assert.equal(s.busy,false);

 // リプレイの権利は区間ではなく次のBETに属する。
 for(const target of ['normal','at','return']){
  e('simReset').onclick();s.freeBet=true;s.coins=0;
  sandbox.__probe.enterPhase(target,'境界');
  assert.equal(s.freeBet,true);assert.equal(sandbox.__probe.betSim(),true);
  assert.equal(s.coins,0);assert.equal(s.freeBet,false);
 }
 e('simReset').onclick();sandbox.__probe.enterPhase('cz','開始');
 await spin();await spin();assert.equal(s.freeBet,true);
 e('simDecision').children[0].onclick();const replayCoins=s.coins;
 e('simBet').onclick();assert.equal(s.coins,replayCoins);assert.equal(s.stake,0);
 // 連続リプレイも各ゲームのBETで一度だけ消費する。
 for(let i=0;i<2;i++){s.cycle='bet';s.role='リプレイ';s.cycle='spin';s.stops=[];[0,1,2].forEach(sandbox.__probe.stopSim);assert.equal(s.freeBet,true);const coins=s.coins;sandbox.__probe.betSim();assert.equal(s.coins,coins);}
 e('simReset').onclick();assert.equal(s.freeBet,false);
 e('simBet').onclick();e('simReset').onclick();assert.equal(s.coins,100);assert.equal(s.freeBet,false);
 console.log('PASS: 1G/CZ/AT/引き戻し/手動→自動/残高不足/リセット競合');
}
main().catch(err=>{console.error(err);process.exitCode=1});
