const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../gas-backend/Code.gs'),'utf8');
class Sheet {
  constructor(name,id,data=[]){this.name=name;this.id=id;this.data=data.map(r=>r.slice());this.maxColumns=20;this.hidden=[];}
  getName(){return this.name;}getSheetId(){return this.id;}
  getLastRow(){let n=this.data.length;while(n&&!this.data[n-1].some(x=>x!==''&&x!=null))n--;return n;}
  getLastColumn(){return Math.max(1,...this.data.map(r=>{let n=r.length;while(n&&(r[n-1]===''||r[n-1]==null))n--;return n;}));}
  getMaxColumns(){return this.maxColumns;}insertColumnsAfter(_,n){this.maxColumns+=n;}
  hideColumns(col){this.hidden.push(col);}hideSheet(){}setFrozenRows(){}
  appendRow(r){this.data.push(r.slice());}
  getRange(row,col,height=1,width=1){const sh=this;return {
    getDisplayValues(){return Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>String(sh.data[row+i-1]?.[col+j-1]??'')));},
    setValues(values){for(let i=0;i<height;i++)for(let j=0;j<width;j++){sh.data[row+i-1]??=[];sh.data[row+i-1][col+j-1]=values[i][j];}return this;},
    setValue(v){sh.data[row-1]??=[];sh.data[row-1][col-1]=v;return this;},setNumberFormat(){return this;}
  };}
}
const headers=['STT','Số ký hiệu','Trích yếu','Loại văn bản','Cơ quan ban hành','Ngày tháng năm ban hành','Nội dung nhiệm vụ','Phòng, đơn vị chủ trì','Phòng, đơn vị phối hợp','Hạn hoàn thành','Số văn bản hoàn thành','Ngày tháng năm hoàn thành','Người tham mưu','Lý do chậm','Ghi chú'];
const task=(name,due='',extra={})=>Object.assign(['1','123/UBND',name,'Công văn','UBND tỉnh','09/10/2026',name,'Kế hoạch - Tài chính','',due,'','','Tùng Lâm','',''],extra);
function env(initial=[]){
  const sheet=new Sheet('Danh sach nhiem vu',123,[headers,...initial]);
  const sheets=[sheet];let counter=10,uuid=0;const props=new Map(),triggers=[],mails=[],logs=[];
  const ss={getSheets:()=>sheets,getSheetByName:n=>sheets.find(s=>s.name===n),insertSheet:n=>{const s=new Sheet(n,++counter);sheets.push(s);return s;}};
  const propertyApi={getProperty:k=>props.get(k)??null,setProperty:(k,v)=>{props.set(k,v);return propertyApi;},deleteProperty:k=>props.delete(k)};
  let locked=false;
  const ctx={console,Date,Map,Object,JSON,String,Number,Math,Array,Error,
    SpreadsheetApp:{getActiveSpreadsheet:()=>ss,flush(){}},
    PropertiesService:{getScriptProperties:()=>propertyApi},
    LockService:{getScriptLock:()=>({waitLock(){if(locked)throw Error('busy');locked=true;},tryLock(){if(locked)return false;locked=true;return true;},releaseLock(){locked=false;}})},
    Utilities:{getUuid:()=>`uuid-${++uuid}`,formatDate(date,tz,format){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:tz==='UTC'?'UTC':'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));if(format==='yyyy-MM-dd')return `${p.year}-${p.month}-${p.day}`;return `${p.day}/${p.month}/${p.year}`+(format.includes('HH')?` ${p.hour}:${p.minute}:${p.second}`:'');}},
    Session:{getEffectiveUser:()=>({getEmail:()=> 'owner@example.com'})},
    MailApp:{getRemainingDailyQuota:()=>ctx.quota,sendEmail:m=>{if(ctx.failMail)throw Error('mail failed');mails.push(m);ctx.quota--; }},
    ScriptApp:{getProjectTriggers:()=>triggers.slice(),deleteTrigger:t=>triggers.splice(triggers.indexOf(t),1),newTrigger(handler){const b={timeBased:()=>b,everyMinutes(n){b.minutes=n;return b;},create(){const t={getHandlerFunction:()=>handler,minutes:b.minutes};triggers.push(t);return t;}};return b;}},
    Logger:{log:s=>logs.push(s)},quota:100,failMail:false
  };
  vm.createContext(ctx);vm.runInContext(source,ctx);
  return {ctx,sheet,sheets,props,triggers,mails,ss};
}
let count=0;
function test(name,run){try{run();count++;console.log('PASS',name);}catch(e){console.error('FAIL',name,e);process.exitCode=1;}}
function setup(initial=[]){const e=env(initial);assert.equal(e.ctx.caiDatBaoVanBanMoi().ok,true);return e;}
test('first setup baselines existing data and does not send email',()=>{const e=setup([task('Old','20/10/2026')]);assert.equal(e.ctx.chayBaoVanBanMoi().sent,0);assert.equal(e.mails.length,0);assert.equal(e.triggers.length,1);assert.equal(e.triggers[0].minutes,5);assert.equal(e.sheet.data[0].slice(0,15).join('|'),headers.join('|'));});
test('new task from automated sheet append sends once to configured owner',()=>{const e=setup();e.sheet.appendRow(task('New','20/10/2026'));assert.equal(e.ctx.chayBaoVanBanMoi().notified,1);assert.equal(e.ctx.chayBaoVanBanMoi().sent,0);assert.equal(e.mails.length,1);assert.equal(e.mails[0].to,'owner@example.com');assert.match(e.mails[0].htmlBody,/20\/10\/2026/);assert.match(e.mails[0].htmlBody,/UBND tỉnh/);});
test('invalid and blank deadline are not sent',()=>{const e=setup();e.sheet.appendRow(task('Invalid','31/02/2026'));e.sheet.appendRow(task('No due',''));e.sheet.appendRow(task('Unknown','Chưa xác định hạn'));assert.equal(e.ctx.chayBaoVanBanMoi().notified,0);assert.equal(e.mails.length,0);});
test('new pending task is sent when deadline is subsequently supplied',()=>{const e=setup();e.sheet.appendRow(task('Pending',''));assert.equal(e.ctx.chayBaoVanBanMoi().sent,0);e.sheet.data[1][9]='20/10/2026';assert.equal(e.ctx.chayBaoVanBanMoi().notified,1);});
test('historical task acquiring deadline is not announced as new',()=>{const e=setup([task('Old no due','')]);e.sheet.data[1][9]='20/10/2026';assert.equal(e.ctx.chayBaoVanBanMoi().notified,0);});
test('completed new tasks are not announced',()=>{const e=setup();e.sheet.appendRow(task('Done number','20/10/2026',{10:'12/BC'}));e.sheet.appendRow(task('Done date','20/10/2026',{11:'19/10/2026'}));assert.equal(e.ctx.chayBaoVanBanMoi().sent,0);});
test('changed contents or deadline after notification do not cause duplicate email',()=>{const e=setup();e.sheet.appendRow(task('New','20/10/2026'));e.ctx.chayBaoVanBanMoi();e.sheet.data[1][6]='Updated';e.sheet.data[1][9]='21/10/2026';assert.equal(e.ctx.chayBaoVanBanMoi().sent,0);assert.equal(e.mails.length,1);});
test('row moves and deleted preceding rows do not change notification identity',()=>{const e=setup([task('Old','20/10/2026')]);e.sheet.appendRow(task('New','21/10/2026'));e.ctx.chayBaoVanBanMoi();e.sheet.data.splice(1,1);assert.equal(e.ctx.chayBaoVanBanMoi().sent,0);});
test('failed MailApp delivery keeps pending and retries successfully',()=>{const e=setup();e.sheet.appendRow(task('New','20/10/2026'));e.ctx.failMail=true;assert.equal(e.ctx.chayBaoVanBanMoi().ok,false);e.ctx.failMail=false;assert.equal(e.ctx.chayBaoVanBanMoi().notified,1);assert.equal(e.mails.length,1);});
test('exhausted email quota keeps pending',()=>{const e=setup();e.sheet.appendRow(task('New','20/10/2026'));e.ctx.quota=0;assert.equal(e.ctx.chayBaoVanBanMoi().ok,false);assert.equal(e.mails.length,0);e.ctx.quota=1;assert.equal(e.ctx.chayBaoVanBanMoi().notified,1);});
test('large arrival batches produce readable groups of at most 30 tasks',()=>{const e=setup();for(let i=0;i<65;i++)e.sheet.appendRow(task('New '+i,'20/10/2026'));const r=e.ctx.chayBaoVanBanMoi();assert.equal(r.sent,3);assert.equal(r.notified,65);assert.equal(e.ctx.chayBaoVanBanMoi().sent,0);});
test('reinstall preserves delivered and pending states and replaces only its own trigger',()=>{const e=setup();e.triggers.push({getHandlerFunction:()=> 'guiNhacHan'});e.sheet.appendRow(task('One','20/10/2026'));e.ctx.chayBaoVanBanMoi();e.sheet.appendRow(task('Two','20/10/2026'));e.ctx.caiDatBaoVanBanMoi();assert.equal(e.ctx.chayBaoVanBanMoi().notified,1);assert.equal(e.triggers.filter(t=>t.getHandlerFunction()==='chayBaoVanBanMoi').length,1);assert.equal(e.triggers.filter(t=>t.getHandlerFunction()==='guiNhacHan').length,1);});
test('disabled feature does not send and preserves prior registry',()=>{const e=setup();e.sheet.appendRow(task('New','20/10/2026'));e.ctx.huyBaoVanBanMoi();assert.equal(e.ctx.chayBaoVanBanMoi().disabled,true);assert.equal(e.mails.length,0);e.ctx.caiDatBaoVanBanMoi();assert.equal(e.ctx.chayBaoVanBanMoi().notified,1);});
test('missing registry fails closed instead of mailing every old task',()=>{const e=setup([task('Old','20/10/2026')]);e.sheets.splice(e.sheets.findIndex(s=>s.name==='Theo dõi báo văn bản mới'),1);assert.equal(e.ctx.chayBaoVanBanMoi().ok,false);assert.equal(e.mails.length,0);e.ctx.caiDatBaoVanBanMoi();assert.equal(e.ctx.chayBaoVanBanMoi().sent,0);});
test('recipient can be changed through sheet configuration',()=>{const e=setup();const cfg=e.ss.getSheetByName('Cấu hình nhắc hạn');cfg.data.find(r=>r[0]==='Email nhận văn bản mới')[1]='lam@example.com';e.sheet.appendRow(task('New','20/10/2026'));e.ctx.chayBaoVanBanMoi();assert.equal(e.mails[0].to,'lam@example.com');});
test('multiple/invalid recipients are rejected without consuming pending tasks',()=>{const e=setup();e.ss.getSheetByName('Cấu hình nhắc hạn').data.find(r=>r[0]==='Email nhận văn bản mới')[1]='a@example.com,b@example.com';e.sheet.appendRow(task('New','20/10/2026'));assert.equal(e.ctx.chayBaoVanBanMoi().ok,false);assert.equal(e.mails.length,0);});
test('status reports configured address, enabled state and errors without sending',()=>{const e=setup();let r=e.ctx.trangThaiBaoVanBanMoi_(e.ctx.docBang_(e.sheet));assert.equal(r.enabled,true);assert.equal(r.version,6);assert.equal(r.email,'owner@example.com');assert.equal(e.mails.length,0);e.ctx.huyBaoVanBanMoi();r=e.ctx.trangThaiBaoVanBanMoi_(e.ctx.docBang_(e.sheet));assert.equal(r.enabled,false);});
test('email escapes document content and rejects unsafe dashboard URL',()=>{const e=setup();const cfg=e.ss.getSheetByName('Cấu hình nhắc hạn');cfg.data.find(r=>r[0]==='Đường link dashboard')[1]='javascript:alert(1)';e.sheet.appendRow(task('<script>bad</script>','20/10/2026'));e.ctx.chayBaoVanBanMoi();assert.match(e.mails[0].htmlBody,/&lt;script&gt;/);assert.doesNotMatch(e.mails[0].htmlBody,/<script>|href="javascript:/);});
test('partial quota failure retries only the unsent portion',()=>{const e=setup();for(let i=0;i<45;i++)e.sheet.appendRow(task('New '+i,'20/10/2026'));e.ctx.quota=1;let r=e.ctx.chayBaoVanBanMoi();assert.equal(r.ok,false);assert.equal(r.notified,30);e.ctx.quota=1;r=e.ctx.chayBaoVanBanMoi();assert.equal(r.notified,15);assert.equal(e.mails.length,2);});
test('a copied row receives its own notification identity',()=>{const e=setup();e.sheet.appendRow(task('New','20/10/2026'));e.ctx.chayBaoVanBanMoi();e.sheet.appendRow(e.sheet.data[1].slice());assert.equal(e.ctx.chayBaoVanBanMoi().notified,1);assert.notEqual(e.sheet.data[1][15],e.sheet.data[2][15]);});
test('missing configured sheet does not fall back and send from another tab',()=>{const e=setup();e.sheets.splice(e.sheets.indexOf(e.sheet),1);assert.equal(e.ctx.chayBaoVanBanMoi().ok,false);assert.equal(e.mails.length,0);});
test('unfinished template rows containing only STT are ignored',()=>{const e=setup();e.sheet.appendRow(['99']);assert.equal(e.ctx.chayBaoVanBanMoi().sent,0);assert.equal(e.sheet.data[1][15],undefined);});
console.log(`${count} tests passed`);
