const today = new Date().toISOString().slice(0,10);
document.getElementById('txnDate').value = today;

const state = JSON.parse(localStorage.getItem('mm_state') || 'null') || {
  accounts: [
    {id:1,name:'Main Account',type:'main'},
    {id:2,name:'Salary',type:'income_fixed'},
    {id:3,name:'Freelance',type:'income_non_fixed'},
    {id:4,name:'Rent',type:'expense_fixed'},
    {id:5,name:'Grocery',type:'expense_non_fixed'},
    {id:6,name:'Loans Given',type:'loan'},
    {id:7,name:'My Bank',type:'bank'}
  ],
  txns: []
};
let parsedReceipt = null;

function save(){ localStorage.setItem('mm_state', JSON.stringify(state)); }
function byId(id){ return state.accounts.find(a=>a.id===Number(id)); }
function fmt(n){ return Number(n).toLocaleString(undefined,{maximumFractionDigits:2}); }

function refreshAccountOptions(){
  const opts = ['<option value="">None</option>'].concat(state.accounts.map(a=>`<option value="${a.id}">${a.name} (${a.type})</option>`)).join('');
  document.getElementById('txnFrom').innerHTML = opts;
  document.getElementById('txnTo').innerHTML = opts;
  document.getElementById('accountsList').innerHTML = state.accounts.map(a=>`<li>${a.name} - <code>${a.type}</code></li>`).join('');
}

function refreshMetrics(){
  const income = state.txns.filter(t=>t.direction==='income').reduce((s,t)=>s+t.amount,0);
  const expense = state.txns.filter(t=>t.direction==='expense').reduce((s,t)=>s+t.amount,0);
  document.getElementById('mIncome').textContent = fmt(income);
  document.getElementById('mExpense').textContent = fmt(expense);
  document.getElementById('mNet').textContent = fmt(income-expense);
}

function refreshTxns(){
  document.getElementById('txnTable').innerHTML = state.txns.slice().reverse().map(t=>`<tr>
    <td>${t.date}</td><td>${t.direction}</td><td>${t.flow}</td><td>${fmt(t.amount)}</td>
    <td>${byId(t.from)?.name||''}</td><td>${byId(t.to)?.name||''}</td><td>${t.category||''}</td><td>${t.party||''}</td>
  </tr>`).join('');
}

function refreshLoans(){
  const map = {};
  state.txns.forEach(t=>{
    if(!t.party) return;
    map[t.party] ||= {given:0,repaid:0};
    if(t.flow==='loan_given') map[t.party].given += t.amount;
    if(t.flow==='loan_repayment') map[t.party].repaid += t.amount;
  });
  document.getElementById('loanTable').innerHTML = Object.entries(map).map(([p,v])=>`<tr><td>${p}</td><td>${fmt(v.given)}</td><td>${fmt(v.repaid)}</td><td>${fmt(v.given-v.repaid)}</td></tr>`).join('');
}

function refreshSuggestions(){
  const expense = state.txns.filter(t=>t.direction==='expense');
  const income = state.txns.filter(t=>t.direction==='income');
  const tips = [];
  const inc = income.reduce((s,t)=>s+t.amount,0), exp = expense.reduce((s,t)=>s+t.amount,0);
  if(state.txns.length===0) tips.push('Add transactions to receive spending insights.');
  if(exp > inc) tips.push('Expenses exceed income. Reduce non-fixed spending this month.');
  if(inc && exp/inc > 0.8) tips.push('Expenses are above 80% of income. Target 20% savings.');
  const grocery = expense.filter(t=>(t.category||'').toLowerCase().includes('grocery')).reduce((s,t)=>s+t.amount,0);
  if(exp && grocery/exp > 0.3) tips.push('Grocery spend is above 30% of expenses. Consider a weekly cap.');
  if(tips.length===0) tips.push('Pattern looks stable. Keep logging transactions for better suggestions.');
  document.getElementById('suggestions').innerHTML = tips.map(t=>`<li>${t}</li>`).join('');
}

function refreshAll(){ refreshAccountOptions(); refreshMetrics(); refreshTxns(); refreshLoans(); refreshSuggestions(); save(); }

document.getElementById('accountForm').addEventListener('submit', e=>{
  e.preventDefault();
  state.accounts.push({ id: Date.now(), name: accountName.value.trim(), type: accountType.value });
  e.target.reset(); refreshAll();
});

document.getElementById('txnForm').addEventListener('submit', e=>{
  e.preventDefault();
  state.txns.push({
    date: txnDate.value, direction: txnDirection.value, flow: txnFlow.value, fixed: txnFixed.value,
    amount: Number(txnAmount.value || 0), from: Number(txnFrom.value)||null, to: Number(txnTo.value)||null,
    category: txnCategory.value, party: txnParty.value, desc: txnDesc.value
  });
  e.target.reset(); txnDate.value=today; refreshAll();
});

document.getElementById('parseReceipt').addEventListener('click', async ()=>{
  const file = document.getElementById('receiptFile').files[0];
  if(!file) return;
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const merchant = (lines[0] || 'Unknown Shop').replace(/[^\w\s&.-]/g,'').slice(0,80);
  const m = text.match(/(?:total|amount|grand total)\s*[:\-]?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
  const allNums = [...text.matchAll(/\b([0-9]+(?:\.[0-9]{1,2})?)\b/g)].map(x=>Number(x[1]));
  const amount = m ? Number(m[1]) : (allNums.at(-1) || 0);
  parsedReceipt = { merchant, amount };
  receiptResult.textContent = `Detected: ${merchant} | Amount: ${fmt(amount)}`;
});

document.getElementById('createFromReceipt').addEventListener('click', ()=>{
  if(!parsedReceipt) return;
  let shop = state.accounts.find(a=>a.name===`Shop: ${parsedReceipt.merchant}`);
  if(!shop){
    shop = {id: Date.now(), name:`Shop: ${parsedReceipt.merchant}`, type:'shop'};
    state.accounts.push(shop);
  }
  const main = state.accounts.find(a=>a.name==='Main Account')?.id;
  state.txns.push({
    date: today, direction:'expense', flow:'regular', fixed:'non_fixed', amount: parsedReceipt.amount,
    from: main || null, to: shop.id, category:'grocery', party: parsedReceipt.merchant, desc:'Auto-created from receipt'
  });
  refreshAll();
});

refreshAll();
