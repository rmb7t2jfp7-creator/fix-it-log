(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FixIt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STATUSES = ['open', 'in-progress', 'repaired', 'retired'];
  function object(value, keys, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== keys.length || keys.some(k => !Object.hasOwn(value, k))) throw new Error(label + ' has unexpected or missing fields.');
  }
  function text(value, max, label) {
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new Error(label + ' must contain 1–' + max + ' characters, without control characters.');
    return value.trim();
  }
  function id(value) {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value)) throw new Error('Invalid record ID.');
    return value;
  }
  function date(value) {
    if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) throw new Error('Use a valid date in YYYY-MM-DD format.');
    const parsed = new Date(value + 'T12:00:00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== value) throw new Error('Use a real calendar date.');
    return value;
  }
  function money(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1000000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) throw new Error('Cost must be 0–1,000,000 with at most two decimal places.');
    return value;
  }
  function attempt(value) {
    object(value, ['id','date','note','cost'], 'Repair attempt');
    return {id:id(value.id), date:date(value.date), note:text(value.note,1000,'Repair note'), cost:money(value.cost)};
  }
  function item(value) {
    object(value, ['id','name','problem','status','created','attempts'], 'Item');
    if (!STATUSES.includes(value.status)) throw new Error('Unknown repair status.');
    if (!Array.isArray(value.attempts) || value.attempts.length > 100) throw new Error('Each item may have at most 100 repair attempts.');
    const attempts = value.attempts.map(attempt);
    if (new Set(attempts.map(a => a.id)).size !== attempts.length) throw new Error('Duplicate repair attempt IDs.');
    const created = date(value.created);
    if (attempts.some(a => a.date < created)) throw new Error('Repair attempts cannot predate the item’s first logged date.');
    return {id:id(value.id), name:text(value.name,100,'Item name'), problem:text(value.problem,1000,'Problem'), status:value.status, created, attempts};
  }
  function validate(value) {
    object(value, ['app','version','currency','items'], 'Backup');
    if (value.app !== 'fix-it-log' || value.version !== 1) throw new Error('This is not a supported Fix-It Log v1 backup.');
    if (!Array.isArray(value.items) || value.items.length > 500) throw new Error('At most 500 items are supported.');
    const items = value.items.map(item);
    if (new Set(items.map(i => i.id)).size !== items.length) throw new Error('Duplicate item IDs.');
    const result = {app:'fix-it-log', version:1, currency:text(value.currency,12,'Currency label'), items};
    if (new TextEncoder().encode(JSON.stringify(result,null,2)).length > 2000000) throw new Error('Journal would exceed the 2 MB backup limit. Export or remove older records first.');
    return result;
  }
  function parse(source) {
    if (typeof source !== 'string' || source.length > 2000000) throw new Error('Backup must be a JSON text file under 2 MB.');
    try { return validate(JSON.parse(source)); } catch (error) { if (error instanceof SyntaxError) throw new Error('File is not valid JSON.'); throw error; }
  }
  function summary(items) {
    const result = {items:items.length, repaired:0, attempts:0, spent:0};
    let cents = 0;
    items.forEach(i => { if (i.status === 'repaired') result.repaired++; result.attempts += i.attempts.length; i.attempts.forEach(a => {cents += Math.round(a.cost * 100);}); });
    result.spent = cents / 100;
    return result;
  }
  function empty() { return {app:'fix-it-log',version:1,currency:'USD',items:[]}; }
  function demo() { return validate({app:'fix-it-log',version:1,currency:'USD',items:[
    {id:'demo-lamp',name:'Desk lamp',problem:'Loose shade and a flickering bulb.',status:'repaired',created:'2026-09-02',attempts:[{id:'a1',date:'2026-09-03',note:'Replaced the bulb with a compatible spare and tightened the shade.',cost:4.50}]},
    {id:'demo-bag',name:'Canvas weekend bag',problem:'A seam is opening beside the handle.',status:'in-progress',created:'2026-09-06',attempts:[{id:'a2',date:'2026-09-07',note:'Bought strong thread; preparing a fabric patch.',cost:3.25}]},
    {id:'demo-chair',name:'Dining chair',problem:'One joint wobbles when the chair moves.',status:'open',created:'2026-09-08',attempts:[]}
  ]}); }
  return {STATUSES,validate,parse,summary,empty,demo,item,attempt,date,money};
});
