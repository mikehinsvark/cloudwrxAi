(function trainingApp(){
 'use strict';
 const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
 const root=document.documentElement,slug=document.body.dataset.chapter;
 const slugs=$$('.chapter-tab').map(a=>a.dataset.chapter);
 const storage={read(key,fallback){try{const value=JSON.parse(localStorage.getItem('cloudwrx-training-'+key));return value??fallback;}catch{return fallback;}},write(key,value){try{localStorage.setItem('cloudwrx-training-'+key,JSON.stringify(value));return true;}catch{return false;}}};
 let timer;
 function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>el.classList.remove('visible'),3500);}
 const themeButton=$('#theme-toggle');
 const sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>';
 const moon='<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>';
 function reflectTheme(){const light=root.dataset.theme==='light';themeButton.setAttribute('aria-label',`Switch to ${light?'dark':'light'} mode`);themeButton.querySelector('span').textContent=light?'Dark mode':'Light mode';themeButton.querySelector('svg').innerHTML=light?moon:sun;$('meta[name="theme-color"]').content=light?'#f2f6ff':'#080f20';}
 reflectTheme();
 themeButton.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('cloudwrx-training-theme',root.dataset.theme);}catch{}reflectTheme();});
 const saved=storage.read('completed',[]);
 const completed=new Set(Array.isArray(saved)?saved.filter(s=>slugs.includes(s)):[]);
 function reflectProgress(){$('#progress-count').textContent=`${completed.size} / ${slugs.length}`;$('#learning-progress').value=completed.size;$$('.chapter-tab').forEach(a=>a.classList.toggle('is-complete',completed.has(a.dataset.chapter)));const done=completed.has(slug);$('#complete-lesson').setAttribute('aria-pressed',String(done));$('#complete-lesson span').textContent=done?'Lesson complete':'Mark lesson complete';}
 reflectProgress();
 $('#complete-lesson').addEventListener('click',()=>{completed.has(slug)?completed.delete(slug):completed.add(slug);const saved=storage.write('completed',[...completed]);reflectProgress();toast(saved?(completed.has(slug)?'Lesson marked complete.':'Lesson marked incomplete.'):'Progress updated for this visit; browser storage is unavailable.');});
 let practice=storage.read('practice',[]);
 if(!Array.isArray(practice))practice=[];
 $$('[data-practice]').forEach(c=>{c.checked=practice.includes(c.dataset.practice);c.addEventListener('change',()=>{practice=$$('[data-practice]:checked').map(x=>x.dataset.practice);storage.write('practice',practice);});});
 const query=new URLSearchParams(location.search),hasRef=query.has('ref'),code=hasRef?query.get('ref').trim():'bbq4pucskp',valid=/^[A-Za-z0-9_-]{1,64}$/.test(code);
 function routeURL(url){const result=new URL(url,location.origin);if(hasRef)result.searchParams.set('ref',query.get('ref'));return result.href;}
 $$('[data-route],.brand').forEach(a=>a.href=routeURL(a.href));
 $$('[data-ref-kind]').forEach(a=>{if(valid){const u=new URL(a.href);u.searchParams.set('ref',code);a.href=u.href;}else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.addEventListener('click',e=>e.preventDefault());}});
 if(!valid){const p=document.createElement('p');p.className='note amber wrap';p.setAttribute('role','alert');p.textContent='This referral code is invalid. Ask the person who shared this link for a corrected one before continuing to signup. The training remains available.';$('.site-header').after(p);}
 async function copy(text){
  try{await navigator.clipboard.writeText(text);return true;}catch{
   const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();let ok=false;try{ok=document.execCommand('copy');}catch{}area.remove();return ok;
  }
 }
 $('#share-lesson').addEventListener('click',async()=>{const u=new URL('/training/'+slug+'/',location.origin);if(hasRef)u.searchParams.set('ref',query.get('ref'));toast(await copy(u.href)?'Lesson link copied.':'Could not copy automatically. Copy the address from your browser.');});
 let detailsBeforePrint=[];
 function preparePrint(){detailsBeforePrint=$$('.lesson details').map(d=>[d,d.open]);$$('.lesson details').forEach(d=>d.open=true);}
 function restorePrint(){detailsBeforePrint.forEach(([d,open])=>d.open=open);detailsBeforePrint=[];}
 window.addEventListener('beforeprint',()=>{if(!detailsBeforePrint.length)preparePrint();});
 window.addEventListener('afterprint',restorePrint);
 $('#print-lesson').addEventListener('click',()=>{preparePrint();window.print();});
 let profile=storage.read('profile',{});
 if(!profile||typeof profile!=='object'||Array.isArray(profile))profile={};
 const form=$('#template-settings');
 if(form){
  ['name','phone','client','partner'].forEach(k=>{form.elements[k].value=typeof profile[k]==='string'?profile[k]:'';});
  form.addEventListener('submit',e=>{e.preventDefault();const next={};for(const k of ['name','phone','client','partner'])next[k]=form.elements[k].value.trim();for(const k of ['client','partner'])if(next[k]){try{if(new URL(next[k]).protocol!=='https:')throw Error();}catch{$('#settings-status').textContent='Use a complete https:// link.';form.elements[k].focus();return;}}
   profile=next;const ok=storage.write('profile',profile);$('#settings-status').textContent=ok?'Saved. Copy a template to use your details.':'Available this visit; browser storage is unavailable.';toast(ok?'Template details saved on this device.':'Details available for this visit.');
  });
  $('#clear-details').addEventListener('click',()=>{profile={};storage.write('profile',{});form.reset();$('#settings-status').textContent='Saved details cleared.';toast('Template details cleared.');});
 }
 $$('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{let text=document.getElementById(b.dataset.copy).textContent;for(const [key,token] of Object.entries({name:'[YOUR NAME]',phone:'[PHONE]',client:'[YOUR CLIENT LINK]',partner:'[YOUR PARTNER LINK]'})){if(profile[key])text=text.split(token).join(profile[key]);}toast(await copy(text)?'Template copied. Review any remaining brackets.':'Copy is unavailable. Select the template text to copy it.');}));
 const objectionSearch=$('#objection-search');
 if(objectionSearch)objectionSearch.addEventListener('input',()=>{const q=objectionSearch.value.trim().toLowerCase();let n=0;$$('.objection').forEach(d=>{const match=d.textContent.toLowerCase().includes(q);d.hidden=!match;if(match)n++;});$('#objection-count').textContent=`${n} question${n===1?'':'s'}`;$('#objection-empty').hidden=n>0;});
 let indexPromise;
 const search=$('#training-search'),results=$('#search-results');
 search.addEventListener('input',async()=>{
  const q=search.value.trim().toLowerCase();if(q.length<2){results.hidden=true;return;}
  results.hidden=false;results.textContent='Searching…';
  try{
   if(!indexPromise)indexPromise=fetch('/training/assets/search-index.json').then(r=>{if(!r.ok)throw Error('search');return r.json();}).catch(e=>{indexPromise=null;throw e;});
   const index=await indexPromise;if(search.value.trim().toLowerCase()!==q)return;
   const terms=q.split(/\s+/);const matches=index.filter(c=>terms.every(t=>(c.title+' '+c.text).toLowerCase().includes(t))).sort((a,b)=>Number(b.title.toLowerCase().includes(q))-Number(a.title.toLowerCase().includes(q)));
   results.replaceChildren();if(!matches.length){const p=document.createElement('p');p.textContent='No matching lessons. Try a broader term.';results.append(p);}
   matches.forEach(c=>{const a=document.createElement('a');a.href=routeURL('/training/'+c.slug+'/#library');const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=c.title;small.textContent=c.intro;a.append(strong,small);results.append(a);});
  }catch{results.textContent='Search is unavailable. Use the chapter tabs below.';}
 });
 search.addEventListener('keydown',e=>{if(e.key==='Escape'){results.hidden=true;search.value='';}if(e.key==='ArrowDown'&&!results.hidden){results.querySelector('a')?.focus();e.preventDefault();}});
 document.addEventListener('click',e=>{if(!e.target.closest('.library-search'))results.hidden=true;});
 const up=$('#section-up'),down=$('#section-down');
 function positions(){return [0,...$$('[data-section]').map(s=>Math.max(0,Math.round(s.getBoundingClientRect().top+scrollY-105)))].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);}
 function move(direction){const ps=positions(),max=Math.max(0,document.documentElement.scrollHeight-innerHeight),current=scrollY;let target=direction>0?ps.find(p=>p>current+12):ps.reverse().find(p=>p<current-12);if(target===undefined)target=direction>0?max:0;window.scrollTo({top:Math.min(target,max),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 up.addEventListener('click',()=>move(-1));down.addEventListener('click',()=>move(1));
 function reflectNav(){up.disabled=scrollY<5;down.disabled=scrollY+innerHeight>=document.documentElement.scrollHeight-5;}
 window.addEventListener('scroll',reflectNav,{passive:true});window.addEventListener('resize',reflectNav);reflectNav();
})();
