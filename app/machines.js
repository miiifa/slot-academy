// 実機情報と教材のパラメーターを同じフィールドに入れない。
export const sources = [
 {id:'official',name:'大都技研 製品ページ（原稿の参照先）',url:'https://www.daitogiken.com/contents/product/slot/sao2/',checked:null,attempted:'2026-10-26',status:'接続制限により本文未照合'},
 {id:'1geki',name:'一撃 SAO2解析（原稿の参照先）',url:'https://1geki.jp/slot/l_sao2/',checked:null,attempted:'2026-10-26',status:'接続制限により本文未照合'},
 {id:'nana',name:'なな徹 SAO2解析（原稿の参照先）',url:'https://nana-press.com/kaiseki/machine/1158/',checked:null,attempted:'2026-10-26',status:'接続制限により本文未照合'}
];
const saoNodes = {
 normal:{name:'通常時',limit:8,goal:'教材の8G目、またはレア役の教材抽選でCZへ',chapter:'s-normal'},
 cz:{name:'CZ｜スコードロンバトル',limit:5,goal:'教材の最終Gで成功・失敗を判定',chapter:'s-cz'},
 at:{name:'AT｜Bullet of Bullets',limit:8,goal:'教材ゲージを消化。レア役で上乗せ・上位CZ権利',chapter:'s-at'},
 last:{name:'ラストアタック（教材）',limit:5,goal:'教材最終GでAT再開、失敗ならAT終了後へ',chapter:'s-return'},
 uppercz:{name:'上位CZ｜デス・ガンバトル',limit:3,goal:'教材最終Gで上位ATへの成功・失敗判定',chapter:'s-upper'},
 upper:{name:'上位AT｜FULL DIVE',limit:8,goal:'教材ゲージ消化後は上位CZへ再挑戦',chapter:'s-upper'},
 return:{name:'AT終了後｜引き戻し練習',limit:50,goal:'教材では各Gで抽選。50G終了時に通常時へ',chapter:'s-return'}
};
export const machines = {
 sao2:{id:'sao2',name:'SAO2を題材にした教材',fictional:false,
 description:'ゲームフローの理解用。実機の内部制御・確率・差枚数管理を再現しません。',
 nodes:saoNodes, start:'normal',
 edges:[['normal','cz','レア役・教材8G'],['normal','at','教材の直撃練習'],['cz','at','成功'],['cz','normal','失敗'],['at','uppercz','挑戦権あり'],['at','last','権利なし・ゲージ終了'],['last','at','再開'],['last','return','AT終了'],['uppercz','upper','成功'],['uppercz','return','失敗後の教材経路'],['upper','uppercz','ゲージ終了'],['return','at','引き戻し成功'],['return','normal','50Gで非当選']],
 model:{bet:3,bell:8,watermelon:3,cherry:2,atBell:9,upperBell:12,czSuccess:.55,upperSuccess:.5,lastSuccess:.3,returnChance:.012,normalRareChance:.3},
 factNote:'設定別性能・天井・打ち方・引き戻し条件は再照合待ち。以下の数値はすべて教材用です。50G・ラストアタック5Gも原稿に記載がありますが、適用条件や抽選時点は未確認。実機のやめどき判断には使用しないでください。',
 facts:[['基本スペック・設定別性能','再照合待ち'],['リール配列・小役の扱い','実機配列は未実装。下のリールは独自の模式図'],['筐体・演出画像','利用条件未確認のため掲載せず。公式へのリンクを使用']],sources:['official','1geki','nana']},
 lab:{id:'lab',name:'架空教材機｜リールラボ',fictional:true,
 description:'実在しない比較用機種。通常→ボーナス→通常の構成で、小役の取りこぼしを学びます。',
 start:'normal',nodes:{normal:{name:'通常時',limit:6,goal:'教材6G目にボーナスへ',chapter:'b-aim'},bonus:{name:'教材ボーナス',limit:4,goal:'教材4G消化で通常時へ',chapter:'b-bonus'}},
 edges:[['normal','bonus','教材6G'],['bonus','normal','4G終了']],
 model:{bet:3,bell:8,watermelon:6,cherry:2,atBell:8,upperBell:8},
 factNote:'すべて架空の教材設定。実在機種の解析値ではありません。スイカを狙わなければ6枚の払い出しを失うモデルです。',
 facts:[['種類','架空のボーナス教材'],['スイカ払い出し','教材6枚／取りこぼし0枚'],['ゲームフロー','通常6G→ボーナス4G→通常']],sources:[]}
};
