export const SUITS=[{id:"S",name:"Piky",symbol:"♠",color:"black",order:0},{id:"C",name:"Kříže",symbol:"♣",color:"black",order:1},{id:"H",name:"Srdce",symbol:"♥",color:"red",order:2},{id:"D",name:"Káry",symbol:"♦",color:"red",order:3}];
export const RANKS=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
export const RANK_ORDER={A:1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,J:11,Q:12,K:13};
export const SUIT_ORDER=Object.fromEntries(SUITS.map(s=>[s.id,s.order]));
export const FIGURE_BLOCK={J:1,Q:2,K:3,A:Infinity};
export const AI_PLAYER=1; export const MAX_ROUNDS=6; export const RECOVERY_LIMIT=5;
