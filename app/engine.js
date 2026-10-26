import {machines} from './machines.js';
export const roles = ['ハズレ','ベル','リプレイ','チェリー','スイカ'];
export class Simulator {
 constructor(machine='sao2',random=Math.random){this.random=random;this.reset(machine);}
 reset(machine=this.machine.id){if(!machines[machine])throw Error('不明な機種');this.machine=machines[machine];this.s={machine,phase:this.machine.start,cycle:'ready',credit:300,total:0,g:0,remaining:this.machine.nodes[this.machine.start].limit,stopped:[],order:[],role:null,replay:false,stake:0,paid:0,aim:true,upperRight:false,boosts:0,history:[],lastEnd:null,forced:null,outcome:'random',message:'BETで3枚を投入 → レバーで成立役を抽選 → 停止操作で入賞を確認。'};return this.s;}
 get node(){return this.machine.nodes[this.s.phase];}
 enter(phase,reason){if(!this.machine.nodes[phase])throw Error('不明な状態');const s=this.s;const from=s.phase;s.phase=phase;s.g=0;s.remaining=this.machine.nodes[phase].limit;s.boosts=0;if(phase==='at'){s.upperRight=false;}s.history.unshift({from,to:phase,reason,total:s.total});s.history=s.history.slice(0,8);s.message=reason;}
 jump(phase){if(!this.machine.nodes[phase])return false;const s=this.s;if(s.cycle==='bet')s.credit+=s.stake;if(s.cycle==='spin'){s.credit+=s.stake;}s.cycle='ready';s.stake=0;s.replay=false;s.role=null;s.stopped=[];s.order=[];s.paid=0;s.upperRight=false;this.enter(phase,'練習移動：未完了のBETは返却。実機では任意に移動できません。');return true;}
 bet(){const s=this.s;if(s.cycle!=='ready')return false;const cost=s.replay?0:this.machine.model.bet;if(s.credit<cost){s.message='架空コイン不足。リセットで無料補充できます。';return false;}s.credit-=cost;s.stake=cost;s.replay=false;s.paid=0;s.role=null;s.stopped=[];s.order=[];s.aim=true;s.cycle='bet';s.message=cost?'3枚BET済み。レバーで内部抽選します。':'リプレイ：追加投入なし。レバーへ。';return true;}
 force(role){if(!roles.includes(role)||this.s.cycle==='spin')return false;this.s.forced=role;return true;}
 lever(){const s=this.s;if(s.cycle!=='bet')return false;const r=this.random();const at=['at','upper','bonus'].includes(s.phase);const thresholds=at?[.65,.75,.85,.90]:[.25,.45,.55,.65];s.role=s.forced || (r<thresholds[0]?'ベル':r<thresholds[1]?'リプレイ':r<thresholds[2]?'チェリー':r<thresholds[3]?'スイカ':'ハズレ');s.forced=null;s.cycle='spin';s.stopped=[false,false,false];s.order=[];s.message='レバーで成立役が決まりました。左→中→右の順番を練習（実機の制御は再現しません）。';return true;}
 stop(index,aim=this.s.aim){const s=this.s;if(s.cycle!=='spin'||![0,1,2].includes(index)||s.stopped[index])return false;s.aim=aim;s.stopped[index]=true;s.order.push(index);if(s.stopped.every(Boolean))this.finish();return true;}
 success(p){return this.s.outcome==='success'||(this.s.outcome==='random'&&this.random()<p);}
 finish(){const s=this.s,m=this.machine.model;const phase=s.phase;const role=s.role;const at=['at','upper','bonus'].includes(phase);const ordered=s.order.join('')==='012';
 let paid=role==='ベル'?(phase==='upper'?m.upperBell:at?m.atBell:m.bell):role==='チェリー'?m.cherry:role==='スイカ'?m.watermelon:0;
 const caught=role!=='スイカ'||(s.aim&&ordered);if(!caught)paid=0;
 s.paid=paid;s.credit+=paid;s.replay=role==='リプレイ';s.total++;s.g++;s.remaining=Math.max(0,s.remaining-1);s.cycle='ready';
 s.message=`成立役：${role}。${caught?'教材の停止形で入賞判定':'スイカの取りこぼし例'}。払い出し${paid}枚／今回差引${paid-s.stake}枚。`+(s.replay?'次Gは追加投入なし。':'')+(!ordered?' 停止順は左→中→右と異なりました。実機の押し順ペナルティは再現していません。':'');
 if(this.machine.id==='lab'){if(s.remaining===0)this.enter(phase==='normal'?'bonus':'normal',phase==='normal'?'教材6G到達 → ボーナス':'教材ボーナス4G終了 → 通常時');return;}
 if(phase==='normal'&&(s.remaining===0||(role==='チェリー'&&this.success(m.normalRareChance))))this.enter('cz','教材のゲーム数／レア役抽選 → CZ');
 else if(phase==='cz'&&s.remaining===0)this.enter(this.success(m.czSuccess)?'at':'normal','CZの教材最終Gで成功・失敗を判定');
 else if(phase==='at'||phase==='upper'){
  if(role==='チェリー'&&s.boosts<2){s.remaining+=2;s.boosts++;s.message+=' 教材スナイパーチャンス成功：ゲージ＋2G。';if(phase==='at'){s.upperRight=true;s.message+=' 上位CZの教材挑戦権を獲得。';}}
  if(s.remaining===0)this.enter(phase==='upper'||s.upperRight?'uppercz':'last',phase==='upper'?'上位AT終了 → 上位CZへ再挑戦':s.upperRight?'権利あり → 上位CZ':'教材ATゲージ終了 → ラストアタック');
 }else if(phase==='last'&&s.remaining===0){if(this.success(m.lastSuccess))this.enter('at','ラストアタックの教材判定でAT再開');else this.endAT('ラストアタック失敗 → AT終了後の教材区間');}
 else if(phase==='uppercz'&&s.remaining===0){if(this.success(m.upperSuccess))this.enter('upper','上位CZの教材判定成功 → FULL DIVE');else this.endAT('上位CZの教材判定失敗 → 終了後の練習経路');}
 else if(phase==='return'){
  if(this.success(m.returnChance))this.enter('at','引き戻し区間の教材抽選成功 → AT復帰');
  else if(s.remaining===0)this.enter('normal','教材50Gを非当選で消化 → 通常時（実機の前兆処理は未再現）');
 }
 }
 endAT(reason){this.s.lastEnd={total:this.s.total,credit:this.s.credit,from:this.s.phase};this.enter('return',reason);}
}
