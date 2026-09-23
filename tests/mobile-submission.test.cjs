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
