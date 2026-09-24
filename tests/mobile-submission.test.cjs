const {test}=require('node:test');const assert=require('node:assert/strict');
const {parseSubmission,checkFiles,report,run}=require('../scripts/check-mobile-submission.cjs');
const issue=(url='https://github.com/arta/rideshare-mobile')=>({title:'[MOBILE DORËZIM] Java ime',user:{login:'arta'},body:`### Java\n\nJava 1\n\n### Linku i punës në GitHub\n\n${url}\n`});
test('parse form; reject other owners, arbitrary hosts and nested paths',()=>{
 assert.equal(parseSubmission(issue()).week,1);
 for(const url of ['https://evil.test/arta/repo','https://github.com/arbenl/repo','https://github.com/arta/repo/tree/main','https://github.com/arta/..'])assert.throws(()=>parseSubmission(issue(url)));
 assert.equal(parseSubmission({title:'Cloud submission'}),null);
 assert.equal(parseSubmission({...issue(),title:'[MOBILE J02] RideShare'}).week,2);
});
function api(files,text='Përgjigjja ime mbi problemin dhe përdoruesit e RideShare. '.repeat(3)) {
 return {rest:{repos:{get:async()=>({data:{private:false,default_branch:'main'}}),getBranch:async()=>({data:{commit:{sha:'abc'}}}),getContent:async args=>({data:args.path?{encoding:'base64',content:Buffer.from(text).toString('base64')}:files})}}};
}
const file=(name,size=500)=>({name,path:name,size,type:'file'});
test('missing files and blank template get actionable feedback; completed document passes',async()=>{
 const sub={owner:'arta',repo:'r',week:2};
 const good=await checkFiles(sub,api([file('java-02.md'),file('skica.png')]));assert.equal(good.checks.filter(c=>c.ok).length,2);
 const bad=await checkFiles(sub,api([file('java-02.md')],'[PLOTËSO] '.repeat(15)));assert.equal(bad.checks.filter(c=>c.ok).length,0);assert.match(bad.checks[1].message,/Upload files/);
 assert.match(report(good),/jo notë/);
});
test('accept existing week-1 document formats; refuse private repos and symlinks',async()=>{
 const sub={owner:'arta',repo:'r',week:1};
 assert.equal((await checkFiles(sub,api([file('Exit-Ticket.pdf'),file('PRD.docx')]))).checks.filter(c=>c.ok).length,2);
 const privateApi=api([]);privateApi.rest.repos.get=async()=>({data:{private:true}});await assert.rejects(checkFiles(sub,privateApi),/publik/);
 assert.equal((await checkFiles(sub,api([{...file('prd.md'),type:'symlink'}]))).checks.filter(c=>c.ok).length,0);
});
test('update one bot report; ignore unsolicited rechecks from other users',async()=>{
 let updates=0;const github=api([file('exit-ticket.md'),file('prd.md')]);
 github.rest.issues={get:async()=>({data:issue()}),listComments:()=>{},updateComment:async()=>updates++,createComment:async()=>assert.fail('should update')};
 github.paginate=async()=>[{id:7,user:{login:'github-actions[bot]'},body:'<!-- mobile-submission-check-v1 -->old'}];
 const context={repo:{owner:'arbenl',repo:'course'},issue:{number:1},eventName:'issues'};
 await run({github,context});assert.equal(updates,1);
 await run({github,context:{...context,eventName:'issue_comment',payload:{comment:{body:'rikontrollo',user:{login:'other'}}}}});assert.equal(updates,1);
});

test('all fifteen weeks are accepted and out-of-range weeks are refused',()=>{
 for(let week=1;week<=15;week++) assert.equal(parseSubmission({...issue(),body:issue().body.replace('Java 1',`Java ${week}`)}).week,week);
 for(const week of ['0','16','2x','1.5','100']) assert.throws(()=>parseSubmission({...issue(),body:issue().body.replace('Java 1',`Java ${week}`)}));
});
function laterApi(nested=false,broken=false){
 const github=api([]);let reads=0;
 github.rest.repos.getContent=async({path,ref})=>{
  assert.equal(ref,'abc');reads++;
  if(!path)return {data:[file('java-03.md'),nested?{name:'aplikacioni',type:'dir'}:file('package.json')]};
  if(path==='aplikacioni')return {data:[{...file('package.json'),path:'aplikacioni/package.json'}]};
  const text=path.endsWith('package.json')?(broken?'not json':JSON.stringify({dependencies:{next:'16'},scripts:{dev:'next dev',build:'next build'}})):'Unë ndërtova listën, detajet dhe kërkesën. Provat e navigimit dhe kthimit funksionuan në telefon.'.repeat(2);
  return {data:{encoding:'base64',content:Buffer.from(text).toString('base64')}};
 };
 return {github,reads:()=>reads};
}
test('later weeks check report and root or nested Next.js metadata, without executing code',async()=>{
 for(const nested of [false,true]){
  const {github}=laterApi(nested);const result=await checkFiles({owner:'arta',repo:'r',week:3},github);
  assert.equal(result.checks.filter(c=>c.ok).length,2);assert.match(result.checks[1].message,/nuk e ekzekuton/);
 }
 const {github}=laterApi(false,true);const result=await checkFiles({owner:'arta',repo:'r',week:3},github);
 assert.equal(result.checks[0].ok,true);assert.equal(result.checks[1].ok,false);
});
test('unchanged revision reuses report; week or revision changes cannot reuse it',async()=>{
 const {github,reads}=laterApi();const sub={owner:'arta',repo:'r',week:3};
 const first=await checkFiles(sub,github);const before=reads();
 assert.deepEqual(await checkFiles(sub,github,report(first)),{unchanged:true});assert.equal(reads(),before);
 const changedWeek=await checkFiles({...sub,week:4},github,report(first));assert.ok(changedWeek.checks);assert.equal(changedWeek.checks[0].ok,false);
 github.rest.repos.getBranch=async()=>({data:{commit:{sha:'def'}}});
 let receivedRef;github.rest.repos.getContent=async args=>{receivedRef=args.ref;return {data:[]};};
 await checkFiles(sub,github,report(first));assert.equal(receivedRef,'def');
});
test('recheck accepts case/whitespace; unrelated comments and forged cache are ignored',async()=>{
 let writes=0;const github=api([file('exit-ticket.md'),file('prd.md')]);
 const first=await checkFiles({owner:'arta',repo:'rideshare-mobile',week:1},github);
 github.rest.issues={get:async()=>({data:issue()}),listComments:()=>{},updateComment:async()=>assert.fail('student comment cannot be updated'),createComment:async()=>writes++};
 github.paginate=async()=>[{id:5,user:{login:'arta'},body:report(first)}];
 const ctx={repo:{owner:'arbenl',repo:'course'},issue:{number:1},eventName:'issue_comment',payload:{comment:{body:'  RIKONTROLLO\n',user:{login:'arta'}}}};
 await run({github,context:ctx});assert.equal(writes,1);
 await run({github,context:{...ctx,payload:{comment:{body:'hello',user:{login:'arta'}}}}});assert.equal(writes,1);
});
test('API failures produce a retry instruction without pretending to award grades',async()=>{
 let body;const github=api([]);github.rest.repos.get=async()=>{throw Object.assign(new Error('unavailable'),{status:503});};
 github.rest.issues={get:async()=>({data:issue()}),listComments:()=>{},createComment:async args=>{body=args.body;}};github.paginate=async()=>[];
 await run({github,context:{repo:{owner:'arbenl',repo:'course'},issue:{number:1},eventName:'issues'}});
 assert.match(body,/Provo më vonë/);assert.match(body,/jo notë/);
});
