import{FIGURE_BLOCK,RANK_ORDER,RANKS,SUIT_ORDER,SUITS}from"./constants.js";
export function shuffle(xs){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function sortCards(cards){return[...cards].sort((a,b)=>SUIT_ORDER[a.suit]-SUIT_ORDER[b.suit]||RANK_ORDER[a.rank]-RANK_ORDER[b.rank])}
export function makeDeck(prefix){const deck=[];for(const s of SUITS)for(const r of RANKS)deck.push({id:`${prefix}-${s.id}-${r}`,suit:s.id,suitName:s.name,symbol:s.symbol,color:s.color,rank:r});return shuffle(deck)}
export function drawToEight(p){const need=Math.max(0,8-p.hand.length),drawn=p.deck.slice(0,Math.min(need,p.deck.length));return{...p,hand:sortCards([...p.hand,...drawn]),deck:p.deck.slice(drawn.length)}}
export const cardLabel=c=>`${c.rank}${c.symbol}`;
export function rankValues(r){return r==="A"?[1,14]:r==="J"?[11]:r==="Q"?[12]:r==="K"?[13]:[Number(r)]}
export const initiativeValue=c=>c.rank==="A"?14:RANK_ORDER[c.rank];
export const cartesian=a=>a.reduce((acc,c)=>acc.flatMap(x=>c.map(y=>[...x,y])),[[]]);
export const attackColor=cards=>cards[0]?.color??null;
export const attackDamage=cards=>!cards?.length?0:cards.length===1?2:cards.length*3;
export function isValidStraight(cards){if(cards.length===0)return false;if(cards.length===1)return true;if(!cards.every(c=>c.suit===cards[0].suit))return false;return cartesian(cards.map(c=>rankValues(c.rank))).some(v=>{const s=[...v].sort((a,b)=>a-b);return new Set(s).size===s.length&&s.every((x,i)=>i===0||x===s[i-1]+1)})}
export function allValidAttacks(hand,lastColor){const sorted=sortCards(hand),out=[];for(let mask=1;mask<1<<sorted.length;mask++){const cards=sorted.filter((_,i)=>mask&1<<i);if(cards.length>5)continue;if(!isValidStraight(cards))continue;if(lastColor&&attackColor(cards)===lastColor)continue;out.push(cards)}return out.sort((a,b)=>attackDamage(b)-attackDamage(a)||b.length-a.length)}
export const canCardBlock=(card,size)=>card.rank in FIGURE_BLOCK&&FIGURE_BLOCK[card.rank]>=size;
export const blockValue=r=>r==="J"?1:r==="Q"?2:r==="K"?3:r==="A"?99:0;
