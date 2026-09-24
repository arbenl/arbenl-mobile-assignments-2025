const VERSION = 'semester-v2';
const MARKER = '<!-- mobile-submission-check-v1 -->';
function field(body, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (body.match(new RegExp(`^### ${escaped}\\s*\\n([\\s\\S]*?)(?=^### |$(?![\\s\\S]))`, 'm'))?.[1] || '').trim();
}
function parseSubmission(issue) {
  if (!/^\[MOBILE (?:DORËZIM|J02)\]/u.test(issue.title || '')) return null;
  const body = issue.body || '';
  const week = issue.title.startsWith('[MOBILE J02]') ? 2 : Number(field(body, 'Java').match(/^Java (1[0-5]|[1-9])(?:\s|$)/)?.[1]);
  if (!Number.isInteger(week) || week < 1 || week > 15) throw new Error('Zgjidh javën përkatëse (1–15) në formular.');
  const raw = field(body, 'Linku i punës në GitHub');
  const match = raw.match(/^https:\/\/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9_.-]+)\/?$/);
  if (!match || match[2]==='.' || match[2]==='..') throw new Error('Kopjo linkun kryesor të repository-t: https://github.com/llogaria/rideshare-mobile. Jo linkun e një skedari, dosjeje ose Pull Request.');
  if (match[1].toLowerCase() !== issue.user.login.toLowerCase()) throw new Error('Dorëzo repository-n në llogarinë tënde GitHub. Hape formularin me të njëjtën llogari që zotëron repository-n.');
  return {week, owner:match[1], repo:match[2]};
}
const names = {
  1: [
    {label:'Exit Ticket', files:['exit-ticket.md','exit-ticket.pdf','exit-ticket.docx','exit-ticket.txt','exit_ticket_lecture1.md']},
    {label:'PRD', files:['prd.md','prd.pdf','prd.docx','prd.txt','prd_template_aab_mobile_2026.md']}
  ],
  2: [
    {label:'PRD e javës 2', files:['java-02.md','java-02.pdf','java-02.docx','java-02.txt']},
    {label:'Skica', files:['skica.jpg','skica.jpeg','skica.png','skica.pdf']}
  ]
};
function cacheKey({owner,repo,week},ref) {return `<!-- ${VERSION}:${owner.toLowerCase()}/${repo.toLowerCase()}:${week}:${ref} -->`;}
async function checkFiles(submission, github, previousBody='') {
  const {owner,repo,week}=submission;
  const metadata=await github.rest.repos.get({owner,repo});
  if(metadata.data.private) throw new Error('Kontrolli automatik lexon vetëm repository publik. Mos publiko të dhëna private. Nëse duhet ta mbash privat, kërko dorëzim të asistuar nga profesori.');
  const branch=await github.rest.repos.getBranch({owner,repo,branch:metadata.data.default_branch});
  const ref=branch.data.commit.sha;
  const key=cacheKey(submission,ref);
  if(previousBody.includes(key))return {unchanged:true};
  const listing=await github.rest.repos.getContent({owner,repo,path:'',ref});
  if(!Array.isArray(listing.data)) throw new Error('Nuk u lexua lista e skedarëve. Provoje përsëri.');
  const checks=[];
  for(const item of (names[week] || [{label:`Raporti i javës ${week}`,files:[`java-${String(week).padStart(2,'0')}.md`,`java-${String(week).padStart(2,'0')}.txt`]}])) {
    const file=listing.data.find(f=>f.type==='file' && item.files.includes(f.name.toLowerCase()));
    if(!file){checks.push({ok:false,message:`${item.label}: mungon. Me Add file → Upload files, ngarko ${item.files[0]} në faqen kryesore të repository-t, jo brenda ZIP-it.`});continue;}
    if(!file.size || file.size>10*1024*1024){checks.push({ok:false,message:`${item.label}: skedari duhet të ketë përmbajtje dhe të jetë më i vogël se 10 MB.`});continue;}
    if(/\.(md|txt)$/i.test(file.name)) {
      if(file.size>100000){checks.push({ok:false,message:`${item.label}: dokumenti tekst duhet të jetë më i vogël se 100 KB.`});continue;}
      const result=await github.rest.repos.getContent({owner,repo,path:file.path,ref});
      if(result.data.encoding!=='base64'){checks.push({ok:false,message:`${item.label}: nuk u lexua përmbajtja. Ruaje si .md ose .txt të zakonshëm.`});continue;}
      const text=Buffer.from(result.data.content,'base64').toString('utf8');
      if(text.trim().length<80 || /\[PLOTËSO\]/iu.test(text)){checks.push({ok:false,message:`${item.label}: plotëso përgjigjet, hiq shenjat [PLOTËSO] dhe ruaje përsëri. Mos dorëzo modelin bosh.`});continue;}
    }
    checks.push({ok:true,message:`${item.label}: skedari u gjet dhe nuk është bosh. Përmbajtja dhe cilësia nuk janë vlerësuar nga ky kontroll.`});
  }
  if(week>=3) {
    let source=listing.data;
    let packageFile=source.find(f=>f.type==='file' && f.name==='package.json');
    if(!packageFile && source.some(f=>f.type==='dir' && f.name==='aplikacioni')) {
      const nested=await github.rest.repos.getContent({owner,repo,path:'aplikacioni',ref});
      source=Array.isArray(nested.data)?nested.data:[];
      packageFile=source.find(f=>f.type==='file' && f.name==='package.json');
    }
    let valid=false;
    if(packageFile && packageFile.size>0 && packageFile.size<=100000) {
      const result=await github.rest.repos.getContent({owner,repo,path:packageFile.path,ref});
      if(result.data.encoding==='base64')try {
        const pkg=JSON.parse(Buffer.from(result.data.content,'base64').toString('utf8'));
        valid=Boolean((pkg.dependencies?.next || pkg.devDependencies?.next) && typeof pkg.scripts?.dev==='string' && typeof pkg.scripts?.build==='string');
      }catch{/* Invalid JSON is a failed check; no student code is executed. */}
    }
    checks.push({ok:valid,message:valid?'Projekti Next.js: u gjet package.json me komandat dev/build. Ky kontroll nuk e ekzekuton ose vlerëson aplikacionin.':'Projekti Next.js: mungon package.json i vlefshëm në rrënjë ose në aplikacioni/. Ruaj kodin me GitHub Desktop → Commit → Push origin; mos ngarko ZIP ose node_modules.'});
  }
  return {checks,ref,key};
}
function report({checks=[],ref,key,error}={}) {
  const count=checks.filter(c=>c.ok).length;
  return `${MARKER}\n${key || ''}\n## Kontrolli automatik i dorëzimit\n\n${error?'⚠️ '+error:`**${count}/${checks.length} skedarë kaluan kontrollin teknik.**\n\n`+checks.map(c=>`${c.ok?'✅':'❌'} ${c.message}`).join('\n\n')}\n\n${ref?`Versioni i kontrolluar: \`${ref}\`.\n\n`:''}Ky është kontroll i dorëzimit, **jo notë**. PDF/DOCX dhe fotografia kontrollohen vetëm për praninë dhe madhësinë; modeli bosh ose cilësia mund të kërkojnë kontroll nga profesori.\n\n**Si e rregulloj?** Hape repository-n tënd → Add file → Upload files → ngarko versionin e korrigjuar → Commit changes. Pastaj këtu poshtë shkruaj vetëm **rikontrollo** dhe kliko Comment. Përditësohet ky raport; mos hap dorëzim tjetër për të njëjtën javë.\n\n[Udhëzimi me hapa](https://arbenl.github.io/lendet/2026-2027/mobile/dorezimet.html)`;
}
async function run({github,context}) {
  const args={...context.repo,issue_number:context.issue.number};
  const {data:issue}=await github.rest.issues.get(args);
  if(issue.pull_request)return;
  if(context.eventName==='issue_comment') {
    const comment=context.payload.comment;
    if(comment.body.trim().toLowerCase()!=='rikontrollo' || comment.user.login.toLowerCase()!==issue.user.login.toLowerCase())return;
  }
  // Only trust our bot's report. Student comments cannot suppress a check.
  const comments=await github.paginate(github.rest.issues.listComments,{...args,per_page:100});
  const prior=comments.find(c=>c.user.login==='github-actions[bot]' && c.body.startsWith(MARKER));
  let result;
  try {const submission=parseSubmission(issue);if(!submission)return;result=await checkFiles(submission,github,prior?.body || '');if(result.unchanged)return;}
  catch(error) {
    if(error.status===404)result={error:'Repository nuk u gjet ose është privat. Kontrollo linkun dhe qasjen publike. Nëse ende nuk ke repository, ndiq udhëzimin poshtë.'};
    else if(error.status)result={error:'GitHub nuk mund ta përfundonte kontrollin tani. Provo më vonë me komentin rikontrollo. Ky gabim nuk është notë.'};
    else result={error:error.message};
  }
  const body=report(result);
  if(prior)await github.rest.issues.updateComment({...context.repo,comment_id:prior.id,body});
  else await github.rest.issues.createComment({...args,body});
}
module.exports={parseSubmission,checkFiles,report,run};
