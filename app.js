(() => {
  'use strict';
  const $ = id => document.getElementById(id), C = window.FixIt, KEY = 'fix-it-log.v1';
  let state = C.empty(), original, demo = false, editing = null, unreadable = null, blocked = false;
  const form = $('item-form');
  const uid = () => globalThis.crypto?.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  function message(text, error=false) { $('message').textContent = text; $('message').classList.toggle('error',error); }
  function load() { try { const raw = localStorage.getItem(KEY); if (raw !== null) {unreadable = raw; state = C.parse(raw); unreadable = null;} } catch(e) {blocked=true; message('Your saved journal could not be read. Export unreadable data if available, then import a valid backup or clear the journal. '+e.message,true);} }
  function commit(next) { try {next=C.validate(next); if (!demo) {if(blocked) throw new Error('Clear the unreadable journal or import a valid backup first.'); localStorage.setItem(KEY,JSON.stringify(next));} state=next; render();return true;} catch(e) {message('Nothing was saved. '+e.message,true);return false;} }
  function node(tag, text, className) {const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
  function button(text, handler, className) {const b=node('button',text,className);b.type='button';b.addEventListener('click',handler);return b;}
  function download(value,name) {const a=document.createElement('a'),url=URL.createObjectURL(new Blob([value],{type:'application/json'}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const cash = n => state.currency+' '+n.toFixed(2);
  function resetForm() {editing=null;form.reset();form.elements.created.value=today();$('editor-title').textContent='Add an item';$('save-item').textContent='Add to journal';$('cancel-edit').hidden=true;}
  function editItem(item) {editing=item.id;['name','problem','status','created'].forEach(k=>form.elements[k].value=item[k]);$('editor-title').textContent='Edit item';$('save-item').textContent='Save changes';$('cancel-edit').hidden=false;form.elements.name.focus();}
  function updateItem(item) {return commit({...state,items:state.items.map(i=>i.id===item.id?item:i)});}
  function removeItem(item) {if(confirm('Delete “'+item.name+'” and all its repair attempts? This cannot be undone.')) {if(commit({...state,items:state.items.filter(i=>i.id!==item.id)})){if(editing===item.id)resetForm();message('Item deleted.');}}}
  function labelled(parent,label,type,name,value='') {const l=node('label',label),input=document.createElement(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.name=name;input.value=value;input.required=true;l.append(input);parent.append(l);return input;}
  function repairDetails(item) {
    const details=node('details'),total=C.summary([item]).spent;
    details.append(node('summary',item.attempts.length+' repair attempt'+(item.attempts.length===1?'':'s')+' · '+cash(total)));
    let attemptEditing=null;
    const attemptForm=node('form',undefined,'attempt-form'),heading=node('h4','Record a repair attempt');attemptForm.append(heading);
    const row=node('div',undefined,'form-row');attemptForm.append(row);
    const date=labelled(row,'Date','date','date',today());date.min=item.created;date.max='9999-12-31';
    const cost=labelled(row,'Cost ('+state.currency+')','number','cost','0');cost.min='0';cost.max='1000000';cost.step='.01';
    const note=labelled(attemptForm,'What did you try?','textarea','note');note.maxLength=1000;note.rows=2;
    const save=node('button','Add attempt','primary');save.type='submit';attemptForm.append(save);
    const cancel=button('Cancel edit',()=>{attemptEditing=null;heading.textContent='Record a repair attempt';date.value=today();cost.value='0';note.value='';save.textContent='Add attempt';cancel.hidden=true;});cancel.hidden=true;attemptForm.append(cancel);
    [...item.attempts].sort((a,b)=>b.date.localeCompare(a.date)).forEach(a=>{
      const entry=node('div',undefined,'attempt');entry.append(node('small',a.date+' · '+cash(a.cost)),node('p',a.note));const actions=node('div',undefined,'attempt-actions');
      actions.append(button('Edit attempt',()=>{attemptEditing=a.id;heading.textContent='Edit repair attempt';date.value=a.date;cost.value=a.cost;note.value=a.note;save.textContent='Save attempt';cancel.hidden=false;note.focus();}),button('Delete attempt',()=>{if(confirm('Delete this repair attempt and its cost?')){if(updateItem({...item,attempts:item.attempts.filter(x=>x.id!==a.id)}))message('Repair attempt deleted.');}},'danger'));entry.append(actions);details.append(entry);
    });
    attemptForm.addEventListener('submit',e=>{e.preventDefault();try{const a=C.attempt({id:attemptEditing||uid(),date:date.value,note:note.value.replace(/\r?\n/g,' '),cost:Number(cost.value)});const next={...item,attempts:attemptEditing?item.attempts.map(x=>x.id===attemptEditing?a:x):[...item.attempts,a]};if(updateItem(next))message('Repair attempt saved'+(demo?' in this fictional demo.':'.'));}catch(error){message(error.message,true);}});
    details.append(attemptForm);return details;
  }
  function render() {
    const totals=C.summary(state.items);$('count').textContent=totals.items;$('repaired').textContent=totals.repaired;$('spent').textContent=cash(totals.spent);$('currency').value=state.currency;
    $('demo-banner').hidden=!demo;$('demo-button').disabled=demo;['export','import','save-currency','clear'].forEach(id=>$(id).disabled=demo);$('recover').hidden=unreadable===null||demo;
    const query=$('search').value.trim().toLowerCase(),status=$('filter').value,items=state.items.filter(i=>(status==='all'||status===i.status)&&(i.name+' '+i.problem).toLowerCase().includes(query));
    $('result-count').textContent=items.length+' of '+state.items.length+' items shown. Totals above cover the whole journal.';$('items').replaceChildren();
    if(!items.length){const empty=node('div',undefined,'empty');empty.append(node('strong',state.items.length?'No matching items':'Your next repair starts here.'),node('p',state.items.length?'Try another search or status.':'Add something you want to fix. Even a small first attempt is worth recording.'));$('items').append(empty);}
    items.forEach(item=>{const card=node('article',undefined,'card'),head=node('div',undefined,'card-head');head.append(node('h3',item.name),node('span',item.status.replace('-',' '),'badge '+item.status));card.append(head,node('p',item.problem),node('small','First logged '+item.created));const actions=node('div',undefined,'card-actions');actions.append(button('Edit item',()=>editItem(item)),button('Delete item',()=>removeItem(item),'danger'));card.append(actions,repairDetails(item));$('items').append(card);});
  }
  form.addEventListener('submit',e=>{e.preventDefault();try{const existing=state.items.find(i=>i.id===editing);const item=C.item({id:editing||uid(),name:form.elements.name.value,problem:form.elements.problem.value.replace(/\r?\n/g,' '),status:form.elements.status.value,created:form.elements.created.value,attempts:existing?.attempts||[]});if(commit({...state,items:editing?state.items.map(i=>i.id===editing?item:i):[item,...state.items]})){resetForm();message('Item saved'+(demo?' in this fictional demo.':'.'));}}catch(error){message(error.message,true);}});
  $('cancel-edit').addEventListener('click',resetForm);$('search').addEventListener('input',render);$('filter').addEventListener('change',render);
  $('save-currency').addEventListener('click',()=>{if(commit({...state,currency:$('currency').value}))message('Currency label saved. Amounts were not converted.');});
  $('export').addEventListener('click',()=>download(JSON.stringify(state,null,2),'fix-it-log-backup.json'));
  $('recover').addEventListener('click',()=>download(unreadable,'fix-it-log-unreadable-data.json'));
  $('import').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2000000)throw new Error('File must be under 2 MB.');const next=C.parse(await file.text());if(confirm('Replace this browser’s entire journal with '+next.items.length+' imported items? Export your current journal first.')){localStorage.setItem(KEY,JSON.stringify(next));state=next;blocked=false;unreadable=null;resetForm();render();message('Backup imported.');}}catch(error){message('Import failed; current journal was not changed. '+error.message,true);}finally{e.target.value='';}});
  $('clear').addEventListener('click',()=>{if(confirm('Permanently clear this browser’s entire journal? Export a backup first.'))try{localStorage.removeItem(KEY);state=C.empty();blocked=false;unreadable=null;resetForm();render();message('Journal cleared.');}catch(e){message('Could not clear browser storage. '+e.message,true);}});
  $('demo-button').addEventListener('click',()=>{original=state;state=C.demo();demo=true;resetForm();render();message('Fictional sample records loaded. Your journal is untouched.');});
  $('exit-demo').addEventListener('click',()=>{state=original;demo=false;resetForm();render();message('Back to your journal.');});
  load();resetForm();render();
})();
