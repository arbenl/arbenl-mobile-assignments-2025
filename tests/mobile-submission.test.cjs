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
 return {rest:{repos:{get:async()=>({data:{private:false,default_branch:'main'}}),getBranch:async()=>({data:{commit:{sha:'abc',commit:{tree:{sha:'tree-abc'}}}}}),getContent:async args=>({data:args.path?{encoding:'base64',content:Buffer.from(text).toString('base64')}:files})}}};
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
 const prefix=nested?'aplikacioni/':'';
 github.rest.git={getTree:async({tree_sha})=>{assert.equal(tree_sha,'tree-abc');return {data:{truncated:false,tree:[
  `${prefix}src/app/page.tsx`,`${prefix}src/app/udhetimi/[id]/page.tsx`,
  `${prefix}src/app/udhetimi/[id]/kerkesa/page.tsx`,`${prefix}src/components/KartaUdhetimi.tsx`
 ].map(path=>({path,type:'blob'}))}}}};
 github.rest.repos.getContent=async({path,ref})=>{
  assert.equal(ref,'abc');reads++;
  if(!path)return {data:[file('java-03.md'),nested?{name:'aplikacioni',type:'dir'}:file('package.json')]};
  if(path==='aplikacioni')return {data:[{...file('package.json'),path:'aplikacioni/package.json'}]};
  const text=path.endsWith('package.json')?(broken?'not json':JSON.stringify({dependencies:{next:'16'},scripts:{dev:'next dev',build:'next build'}})):'# Java 3\n### Prova 1: Lista\nUdhëtimet u shfaqën në telefon pa lëvizje horizontale.\n### Prova 2: Detajet\nUdhëtimi i dytë tregoi orën dhe vendtakimin e pritur.\n### Prova 3: Kërkesa\nSimulimi shfaqi Në pritje dhe nuk pretendoi rezervim real.\n';
  return {data:{encoding:'base64',content:Buffer.from(text).toString('base64')}};
 };
 return {github,reads:()=>reads};
}
test('later weeks check report and root or nested Next.js metadata, without executing code',async()=>{
 for(const nested of [false,true]){
  const {github}=laterApi(nested);const result=await checkFiles({owner:'arta',repo:'r',week:3},github);
  assert.equal(result.checks.filter(c=>c.ok).length,5);assert.match(result.checks[1].message,/nuk e ekzekuton/);
 }
 const {github}=laterApi(false,true);const result=await checkFiles({owner:'arta',repo:'r',week:3},github);
 assert.equal(result.checks[0].ok,true);assert.equal(result.checks[1].ok,false);
});
test('week 3 gives specific feedback for missing routes, component and unfilled probes',async()=>{
 const {github}=laterApi();
 github.rest.git.getTree=async()=>({data:{truncated:false,tree:[{path:'src/app/page.tsx',type:'blob'}]}});
 const original=github.rest.repos.getContent;
 github.rest.repos.getContent=async args=>args.path==='java-03.md'?{data:{encoding:'base64',content:Buffer.from('Ky është raporti im i gjatë për RideShare, por ende nuk i kam plotësuar tri provat në klasë.').toString('base64')}}:original(args);
 const result=await checkFiles({owner:'arta',repo:'r',week:3},github);
 assert.equal(result.checks[2].ok,false);assert.match(result.checks[2].message,/Prova 1, 2, 3/);
 assert.equal(result.checks[3].ok,false);assert.match(result.checks[3].message,/Detajet/);
 assert.equal(result.checks[4].ok,false);assert.match(result.checks[4].message,/KartaUdhetimi/);
 assert.match(report(result),/2\/5 kontrolle teknike/);
});
test('unchanged revision reuses report; week or revision changes cannot reuse it',async()=>{
 const {github,reads}=laterApi();const sub={owner:'arta',repo:'r',week:3};
 const first=await checkFiles(sub,github);const before=reads();
 assert.deepEqual(await checkFiles(sub,github,report(first)),{unchanged:true});assert.equal(reads(),before);
 const changedWeek=await checkFiles({...sub,week:4},github,report(first));assert.ok(changedWeek.checks);assert.equal(changedWeek.checks[0].ok,false);
 github.rest.repos.getBranch=async()=>({data:{commit:{sha:'def',commit:{tree:{sha:'tree-def'}}}}});
 let receivedRef;github.rest.repos.getContent=async args=>{receivedRef=args.ref;return {data:[]};};
 github.rest.git.getTree=async({tree_sha})=>{assert.equal(tree_sha,'tree-def');return {data:{truncated:false,tree:[]}};};
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

function week4Api({nested=false,src=true,omit=[],env=false,driver=true,reportText}={}) {
 const {github,reads}=laterApi(nested);
 const prefix=nested?'aplikacioni/':'';
 const source=prefix+(src?'src/':'');
 const required=[prefix+'schema.sql',source+'lib/db.ts',source+'lib/udhetimet.ts',source+'app/page.tsx',source+'app/udhetimi/[id]/page.tsx',source+'app/udhetimi/[id]/kerkesa/page.tsx'];
 github.rest.git.getTree=async()=>({data:{truncated:false,tree:[...required.filter(p=>!omit.some(o=>p.endsWith(o))),prefix+'.env.example',...(env?[prefix+'.env.local']:[])].map(path=>({path,type:'blob'}))}});
 const original=github.rest.repos.getContent;
 github.rest.repos.getContent=async args=>{
  if(!args.path)return {data:[file('java-04.md'),nested?{name:'aplikacioni',type:'dir'}:file('package.json')]};
  if(args.path.endsWith('package.json'))return {data:{encoding:'base64',content:Buffer.from(JSON.stringify({dependencies:{next:'16',...(driver?{'@neondatabase/serverless':'1','server-only':'0.0.1'}:{})},scripts:{dev:'next dev',build:'next build'}})).toString('base64')}};
  if(args.path==='java-04.md')return {data:{encoding:'base64',content:Buffer.from(reportText||'# Java 4\n### Prova 1\nOra e ID 2 ndryshoi në listë dhe në detaje pas rifreskimit.\n### Prova 2\nWHERE false shfaqi mesazhin e listës bosh dhe kartat u rikthyen.\n### Prova 3\nPa konfigurim doli gabim lidhjeje; riktheva emrin dhe punoi përsëri.').toString('base64')}};
  return original(args);
 };
 return {github,reads};
}
test('week 4 accepts root/nested apps, src or app layout and safe env examples',async()=>{
 for(const nested of [false,true])for(const src of [false,true]) {
  const {github}=week4Api({nested,src});const result=await checkFiles({owner:'arta',repo:'r',week:4},github);
  assert.equal(result.checks.filter(c=>c.ok).length,5,JSON.stringify(result.checks));
  assert.match(report(result),/5\/5 kontrolle teknike/);
 }
});
test('week 4 identifies missing Neon files, dependencies, empty probes and tracked secrets',async()=>{
 const {github}=week4Api({omit:['schema.sql','lib/db.ts'],env:true,driver:false,reportText:'Ky është raporti im për RideShare me Neon por nuk i kam dokumentuar ende provat e kërkuara gjatë orës.'});
 const result=await checkFiles({owner:'arta',repo:'r',week:4},github);
 assert.equal(result.checks[2].ok,false);assert.match(result.checks[2].message,/Prova 1, 2, 3/);
 assert.equal(result.checks[3].ok,false);assert.match(result.checks[3].message,/schema.sql/);assert.match(result.checks[3].message,/npm install/);
 assert.equal(result.checks[4].ok,false);assert.match(result.checks[4].message,/\.env.local/);
 assert.match(result.checks[4].message,/ndërro fjalëkalimin/);
});
test('week 4 refuses truncated file lists and reads only metadata/documents',async()=>{
 const {github}=week4Api();
 github.rest.git.getTree=async()=>({data:{truncated:true,tree:[]}});
 await assert.rejects(checkFiles({owner:'arta',repo:'r',week:4},github),/shumë skedarë/);
 const calls=[];const clean=week4Api().github;const original=clean.rest.repos.getContent;
 clean.rest.repos.getContent=async args=>{calls.push(args.path);return original(args);};
 await checkFiles({owner:'arta',repo:'r',week:4},clean);
 assert.deepEqual(calls,['','java-04.md','package.json']);
});
