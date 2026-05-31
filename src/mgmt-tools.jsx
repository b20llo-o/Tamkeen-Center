/* =========================================================================
   Management tools — window.MgmtTools: Schedules, Announcements, Cloud, Lookup
   ========================================================================= */
(function () {
  const { theme, L, Icon, fmtDate } = window.TC;
  const { Avatar, Btn, Badge, Card, EmptyState, Field, Input, Select, Textarea, Modal, ScoreRing } = window.UI;
  const { ScheduleTable, downloadScheduleCSV } = window.Dash;
  const { useState } = React;

  // ----------------------------------------------------------- SCHEDULES
  function SchedulesTab({ lang, db, actions, uid }) {
    const t = L(lang);
    const [builder, setBuilder] = useState(false);
    const [sel, setSel] = useState(null);
    const [sch, setSch] = useState({ name:'', type:'weekly', columns:['اليوم','الحصة 1','الحصة 2'], rows:[['','',''],['','','']] });

    const selected = db.schedules.find(s=>s.id===sel);
    const setCol = (i,v)=>setSch(p=>({ ...p, columns:p.columns.map((c,k)=>k===i?v:c) }));
    const setCell = (r,c,v)=>setSch(p=>({ ...p, rows:p.rows.map((row,ri)=>ri===r?row.map((cell,ci)=>ci===c?v:cell):row) }));
    const addCol = ()=>setSch(p=>({ ...p, columns:[...p.columns,''], rows:p.rows.map(r=>[...r,'']) }));
    const addRow = ()=>setSch(p=>({ ...p, rows:[...p.rows, p.columns.map(()=>'')] }));
    const create = ()=>{ if(!sch.name||!sch.columns.filter(c=>c.trim()).length) return; actions.addSchedule(sch, uid); setBuilder(false); setSch({ name:'', type:'weekly', columns:['اليوم','الحصة 1','الحصة 2'], rows:[['','',''],['','','']] }); };

    return (
      <div style={{ display:'flex', gap:24 }} className="tc-split">
        <div style={{ width:300, flexShrink:0 }} className="tc-split-aside">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}><Icon name="calendar" size={18} color={theme.primary} /><h3 style={{ fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('schedules')}</h3><Badge tone="neutral">{db.schedules.length}</Badge></div>
            <Btn size="sm" variant="primary" icon="plus" onClick={()=>setBuilder(true)}>{t('add')}</Btn>
          </div>
          <div style={{ display:'grid', gap:8 }}>
            {db.schedules.length===0 ? <EmptyState icon="calendar" title={t('noSchedules')} /> :
              db.schedules.map(s=>(
                <Card key={s.id} pad={14} onClick={()=>setSel(s.id)} style={{ background:sel===s.id?theme.creamDeep:theme.paper }}>
                  <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:theme.goldSoft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="calendar" size={17} color={theme.primaryDeep} /></div>
                    <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:13.5, fontWeight:600, color:theme.ink }}>{s.title}</p><p style={{ fontSize:11.5, color:theme.muted }}>{t(s.type)||s.type}</p></div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          {selected ? (
            <Card pad={22}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <h3 style={{ fontSize:17, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{selected.title}</h3>
                <div style={{ display:'flex', gap:8 }}>
                  <Btn size="sm" variant="soft" icon="download" onClick={()=>downloadScheduleCSV({ itemName:selected.title, scheduleData:selected })}>{t('downloadExcel')}</Btn>
                  <Btn size="sm" variant="danger" icon="trash" onClick={()=>{ actions.deleteSchedule(selected.id); setSel(null); }}>{t('delete')}</Btn>
                </div>
              </div>
              <ScheduleTable data={selected} />
            </Card>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:360, color:theme.muted }}>
              <Icon name="calendar" size={40} color={theme.mutedSoft} style={{ marginBottom:12 }} />
              <p style={{ fontSize:14 }}>{lang==='ar'?'اختر جدولاً لعرضه أو أنشئ جدولاً جديداً':'Select a schedule or create one'}</p>
            </div>
          )}
        </div>

        {builder && (
          <Modal title={t('newSchedule')} onClose={()=>setBuilder(false)} width={680}>
            <div style={{ display:'grid', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
                <Field label={t('scheduleName')}><Input value={sch.name} onChange={e=>setSch({...sch,name:e.target.value})} placeholder={lang==='ar'?'مثال: الجدول الأسبوعي':'e.g. Weekly schedule'} /></Field>
                <Field label={t('template')}><Select value={sch.type} onChange={e=>setSch({...sch,type:e.target.value})}>{['weekly','monthly','daily','seasonal'].map(x=><option key={x} value={x}>{t(x)}</option>)}</Select></Field>
              </div>
              <div style={{ overflowX:'auto', border:`1px solid ${theme.line}`, borderRadius:12, padding:10 }}>
                <table style={{ borderCollapse:'collapse' }}>
                  <thead><tr>{sch.columns.map((c,i)=>(<th key={i} style={{ padding:4 }}><input value={c} onChange={e=>setCol(i,e.target.value)} style={{ width:120, padding:'7px 9px', borderRadius:8, border:`1px solid ${theme.line}`, background:theme.creamDeep, fontWeight:700, fontSize:12.5, color:theme.ink, textAlign:'center', outline:'none', fontFamily:'Cairo, sans-serif' }} /></th>))}<th style={{ padding:4 }}><button onClick={addCol} style={{ width:34, height:34, borderRadius:8, border:`1px dashed ${theme.line}`, background:theme.paper, cursor:'pointer', color:theme.primary }}><Icon name="plus" size={15} /></button></th></tr></thead>
                  <tbody>{sch.rows.map((row,ri)=>(<tr key={ri}>{row.map((cell,ci)=>(<td key={ci} style={{ padding:4 }}><input value={cell} onChange={e=>setCell(ri,ci,e.target.value)} style={{ width:120, padding:'7px 9px', borderRadius:8, border:`1px solid ${theme.lineSoft}`, background:theme.paper, fontSize:12.5, color:theme.brown, textAlign:'center', outline:'none', fontFamily:'Cairo, sans-serif' }} /></td>))}</tr>))}</tbody>
                </table>
                <button onClick={addRow} style={{ marginTop:8, display:'flex', alignItems:'center', gap:6, background:theme.paper, border:`1px dashed ${theme.line}`, borderRadius:8, padding:'6px 12px', cursor:'pointer', color:theme.primary, fontSize:12.5, fontFamily:'Cairo, sans-serif', fontWeight:600 }}><Icon name="plus" size={14} />{t('addRow')}</button>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <Btn variant="soft" onClick={()=>setBuilder(false)}>{t('cancel')}</Btn>
                <Btn variant="primary" icon="check" onClick={create}>{t('createSchedule')}</Btn>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // -------------------------------------------------------- ANNOUNCEMENTS
  const TEMPLATES = [
    { id:'general', icon:'general', tone:'info', key:'tmplGeneral', seed:{ar:'يسرّ إدارة مركز تمكين أن تعلن…',en:'Tamkeen Center is pleased to announce…'} },
    { id:'exam', icon:'exam', tone:'ok', key:'tmplExam', seed:{ar:'تعلن إدارة المركز عن موعد الامتحانات…',en:'The center announces the exam schedule…'} },
    { id:'holiday', icon:'holiday', tone:'gold', key:'tmplHoliday', seed:{ar:'تعلن إدارة المركز عن إجازة بمناسبة…',en:'The center announces a holiday for…'} },
    { id:'event', icon:'event', tone:'neutral', key:'tmplEvent', seed:{ar:'يسرّ المركز دعوتكم لحضور فعالية…',en:'You are invited to attend…'} },
    { id:'urgent', icon:'urgent', tone:'bad', key:'tmplUrgent', seed:{ar:'تنبيه عاجل من إدارة المركز…',en:'Urgent notice from the center…'} },
  ];
  function AnnouncementsTab({ lang, db, actions, uid }) {
    const t = L(lang);
    const [open, setOpen] = useState(false);
    const [tmpl, setTmpl] = useState('general');
    const [form, setForm] = useState({ title:'', content:'' });
    const [aud, setAud] = useState(['students','teachers','admins']);
    const AUD = [['students','audStudents'],['teachers','audTeachers'],['admins','audAdmins']];
    const toggleAud = (k)=>setAud(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]);
    const pickTmpl = (id)=>{ setTmpl(id); const tt=TEMPLATES.find(x=>x.id===id); setForm(f=>({ ...f, content:f.content||tt.seed[lang] })); };
    const publish = ()=>{ if(!form.title||!form.content) return; if(aud.length===0){ alert(t('pickAudience')); return; } actions.createAnnouncement({ ...form, template:tmpl, audience:aud }, uid); setForm({ title:'', content:'' }); setTmpl('general'); setAud(['students','teachers','admins']); setOpen(false); };
    const tmObj = (id)=>TEMPLATES.find(x=>x.id===id)||TEMPLATES[0];
    return (
      <div style={{ maxWidth:820, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}><Icon name="megaphone" size={20} color={theme.primary} /><h2 style={{ fontSize:19, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('announcements')}</h2><Badge tone="neutral">{db.announcements.length}</Badge></div>
          <Btn variant="primary" icon="plus" onClick={()=>setOpen(true)}>{t('newAnnouncement')}</Btn>
        </div>
        {db.announcements.length===0 ? <EmptyState icon="megaphone" title={t('noAnnouncements')} /> : (
          <div style={{ display:'grid', gap:12 }}>
            {[...db.announcements].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(a=>{
              const tm=tmObj(a.template);
              return (
                <Card key={a.id} pad={20} style={{ borderInlineStart:`4px solid ${theme[tm.tone]||theme.primary}` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:7 }}>
                        <div style={{ width:34, height:34, borderRadius:10, background:theme[tm.tone+'Bg']||theme.creamDeep, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={tm.icon} size={16} color={theme[tm.tone]||theme.primary} /></div>
                        <h3 style={{ fontSize:15.5, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{a.title}</h3>
                        <Badge tone={tm.tone}>{t(tm.key)}</Badge>
                      </div>
                      <p style={{ fontSize:13.5, color:theme.brown, lineHeight:1.75, marginBottom:8 }}>{a.content}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <p style={{ fontSize:11.5, color:theme.muted }}>{fmtDate(a.createdAt, lang)}</p>
                        <span style={{ color:theme.line }}>•</span>
                        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:theme.muted }}><Icon name="users" size={12} />
                          {(!a.audience || a.audience.length>=3) ? t('audAll') : a.audience.map(x=>t(x==='students'?'audStudents':x==='teachers'?'audTeachers':'audAdmins')).join('، ')}
                        </span>
                      </div>
                    </div>
                    <button onClick={()=>actions.deleteAnnouncement(a.id)} style={{ background:theme.badBg, border:'none', borderRadius:9, padding:7, color:theme.bad, cursor:'pointer' }}><Icon name="trash" size={15} /></button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        {open && (
          <Modal title={t('newAnnouncement')} onClose={()=>setOpen(false)} width={560}>
            <div style={{ display:'grid', gap:16 }}>
              <Field label={t('template')}>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {TEMPLATES.map(tm=>{
                    const on=tmpl===tm.id;
                    return <button key={tm.id} onClick={()=>pickTmpl(tm.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:10, border:`1.5px solid ${on?theme[tm.tone]:theme.line}`, background:on?(theme[tm.tone+'Bg']||theme.creamDeep):theme.paper, cursor:'pointer', fontFamily:'Cairo, sans-serif', fontWeight:600, fontSize:13, color:on?theme[tm.tone]:theme.brown }}><Icon name={tm.icon} size={15} />{t(tm.key)}</button>;
                  })}
                </div>
              </Field>
              <Field label={t('announcementTitle')}><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></Field>
              <Field label={t('announcementContent')}><Textarea rows={4} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} /></Field>
              <Field label={t('audience')} hint={t('audienceHint')}>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {AUD.map(([k,lab])=>{
                    const on=aud.includes(k);
                    return <button key={k} onClick={()=>toggleAud(k)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 14px', borderRadius:10, border:`1.5px solid ${on?theme.primary:theme.line}`, background:on?theme.creamDeep:theme.paper, cursor:'pointer', fontFamily:'Cairo, sans-serif', fontWeight:600, fontSize:13, color:on?theme.ink:theme.brown }}>
                      <span style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${on?theme.primary:theme.line}`, background:on?theme.primary:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>{on && <Icon name="check" size={12} color="#fff" />}</span>
                      {t(lab)}
                    </button>;
                  })}
                </div>
              </Field>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <Btn variant="soft" onClick={()=>setOpen(false)}>{t('cancel')}</Btn>
                <Btn variant="primary" icon="megaphone" onClick={publish}>{t('publish')}</Btn>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- CLOUD
  function CloudTab({ lang, db, actions, uid }) {
    const t = L(lang);
    const [tray, setTray] = useState([]); // {key,name,type,scheduleData}
    const [recips, setRecips] = useState([]);
    const [q, setQ] = useState('');
    const [done, setDone] = useState(false);
    const students = db.users.filter(u=>u.role==='student');
    const teachers = db.users.filter(u=>u.role==='teacher');
    const addSchedule = (s)=>{ if(tray.some(x=>x.key==='sch'+s.id)) return; setTray(p=>[...p,{ key:'sch'+s.id, name:s.title, type:'schedule', scheduleData:{ columns:s.columns, rows:s.rows } }]); };
    const addFile = ()=>{ const n=`ملف-${Date.now().toString().slice(-4)}.pdf`; setTray(p=>[...p,{ key:'f'+Date.now(), name:n, type:'file', fileSize:'128 KB' }]); };
    const toggleR = (k)=>setRecips(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]);
    const filteredPeople = [...teachers, ...students].filter(u=>u.name.includes(q)||u.accessKey.includes(q.toUpperCase()));
    const share = ()=>{ if(!tray.length||!recips.length) return; actions.shareItems(tray, recips, uid); setDone(true); setTray([]); setRecips([]); setTimeout(()=>setDone(false), 2600); };
    return (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }} className="tc-form-grid">
        {/* left: build tray */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}><Icon name="cloud" size={20} color={theme.primary} /><h2 style={{ fontSize:18, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('cloudSystem')}</h2></div>
          <Card pad={16} style={{ marginBottom:14 }}>
            <p style={{ fontSize:12.5, fontWeight:700, color:theme.muted, marginBottom:10 }}>{t('schedules')}</p>
            <div style={{ display:'grid', gap:8 }}>
              {db.schedules.map(s=>(
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:theme.paperAlt }}>
                  <Icon name="calendar" size={15} color={theme.primary} /><span style={{ flex:1, fontSize:13, fontWeight:600, color:theme.ink }}>{s.title}</span>
                  <Btn size="sm" variant="ghost" icon="plus" onClick={()=>addSchedule(s)}>{t('addToCloud')}</Btn>
                </div>
              ))}
              <Btn size="sm" variant="soft" icon="upload" onClick={addFile}>{t('attachFile')}</Btn>
            </div>
          </Card>
          {tray.length>0 && (
            <Card pad={16}>
              <p style={{ fontSize:12.5, fontWeight:700, color:theme.muted, marginBottom:10 }}>{lang==='ar'?'العناصر المختارة':'Selected items'} ({tray.length})</p>
              <div style={{ display:'grid', gap:8 }}>
                {tray.map(it=>(
                  <div key={it.key} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:theme.goldSoft }}>
                    <Icon name={it.type==='schedule'?'calendar':'fileText'} size={15} color={theme.primaryDeep} /><span style={{ flex:1, fontSize:13, fontWeight:600, color:theme.ink }}>{it.name}</span>
                    <button onClick={()=>setTray(p=>p.filter(x=>x.key!==it.key))} style={{ background:'none', border:'none', cursor:'pointer', color:theme.bad }}><Icon name="x" size={15} /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        {/* right: recipients */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}><Icon name="send" size={19} color={theme.primary} /><h2 style={{ fontSize:18, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('shareTo')}</h2><Badge tone="neutral">{recips.length}</Badge></div>
          <div style={{ position:'relative', marginBottom:12 }}>
            <Icon name="search" size={15} color={theme.muted} style={{ position:'absolute', insetInlineStart:12, top:'50%', transform:'translateY(-50%)' }} />
            <Input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search')} style={{ paddingInlineStart:36 }} />
          </div>
          <Card pad={12} style={{ maxHeight:330, overflowY:'auto' }}>
            <div style={{ display:'grid', gap:6 }}>
              {filteredPeople.map(u=>{
                const on=recips.includes(u.accessKey);
                return (
                  <button key={u.accessKey} onClick={()=>toggleR(u.accessKey)} style={{ display:'flex', alignItems:'center', gap:11, padding:'8px 10px', borderRadius:10, background:on?theme.goldSoft:'transparent', border:'none', cursor:'pointer', textAlign:lang==='ar'?'right':'left', width:'100%' }}>
                    <Avatar name={u.name} img={u.img} size={32} accent={u.role==='teacher'?theme.tan:theme.gold} />
                    <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:13, fontWeight:600, color:theme.ink }}>{u.name}</p><span style={{ fontSize:11, color:theme.muted }} dir="ltr">{u.accessKey}</span></div>
                    <Badge tone={u.role==='teacher'?'neutral':'gold'}>{u.role==='teacher'?t('teacher'):t('student')}</Badge>
                    <span style={{ width:20, height:20, borderRadius:6, border:`1.5px solid ${on?theme.primary:theme.line}`, background:on?theme.primary:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>{on && <Icon name="check" size={13} color="#fff" />}</span>
                  </button>
                );
              })}
            </div>
          </Card>
          <div style={{ marginTop:16 }}>
            {done ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:12, background:theme.okBg, color:theme.ok, fontWeight:700, fontSize:14 }}><Icon name="checkCircle" size={18} />{t('sent')}</div>
              : <Btn full size="lg" variant="primary" icon="send" disabled={!tray.length||!recips.length} onClick={share}>{t('shareNow')}</Btn>}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------- STUDENTS MANAGEMENT
  function LookupTab({ lang, db, actions }) {
    const t = L(lang);
    const [selId, setSelId] = useState(null);
    const [q, setQ] = useState('');
    const [editBeh, setEditBeh] = useState(false);
    const [gradeModal, setGradeModal] = useState(null); // null | {} (new) | grade (edit)
    const [gForm, setGForm] = useState({ subject:'', score:'', notes:'' });

    const students = db.users.filter(u=>u.role==='student');
    const filtered = students.filter(s=>s.name.includes(q)||s.accessKey.includes(q.toUpperCase()));
    const selected = students.find(s=>s.accessKey===selId);
    const grades = selected ? db.grades.filter(g=>g.studentId===selected.accessKey) : [];
    const assigns = selected ? db.assignments.filter(a=>a.studentId===selected.accessKey) : [];
    const beh = selected ? (db.behaviorScores[selected.accessKey]||0) : 0;

    const openNew = ()=>{ setGForm({ subject:'', score:'', notes:'' }); setGradeModal({}); };
    const openEdit = (g)=>{ setGForm({ subject:g.subject, score:g.score, notes:g.notes||'' }); setGradeModal(g); };
    const saveGrade = ()=>{
      if(!gForm.subject||!gForm.score) return;
      if(gradeModal && gradeModal.id) actions.editGrade(gradeModal.id, gForm);
      else actions.addGrade(selected.accessKey, gForm, 'ADMIN');
      setGradeModal(null);
    };

    return (
      <div style={{ display:'flex', gap:24 }} className="tc-split">
        <div style={{ width:300, flexShrink:0 }} className="tc-split-aside">
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
            <Icon name="gradCap" size={18} color={theme.primary} /><h3 style={{ fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('allStudents')}</h3><Badge tone="neutral">{students.length}</Badge>
          </div>
          <div style={{ position:'relative', marginBottom:12 }}>
            <Icon name="search" size={15} color={theme.muted} style={{ position:'absolute', insetInlineStart:12, top:'50%', transform:'translateY(-50%)' }} />
            <Input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search')} style={{ paddingInlineStart:36 }} />
          </div>
          <div style={{ display:'grid', gap:8 }}>
            {filtered.length===0 ? <p style={{ textAlign:'center', fontSize:13, color:theme.muted, padding:'24px 0' }}>{t('noStudents')}</p> :
              filtered.map(s=>{
                const sBeh = db.behaviorScores[s.accessKey]||0;
                const on = selId===s.accessKey;
                return (
                  <Card key={s.accessKey} pad={12} onClick={()=>{setSelId(s.accessKey);setEditBeh(false);}} style={{ background:on?theme.creamDeep:theme.paper, border:`1px solid ${on?theme.line:theme.lineSoft}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                      <Avatar name={s.name} img={s.img} size={38} accent={theme.gold} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13.5, fontWeight:600, color:theme.ink }}>{s.name}</p>
                        <span style={{ fontSize:11.5, color:theme.muted }} dir="ltr">{s.accessKey}</span>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <p style={{ fontSize:14, fontWeight:800, color:sBeh>=80?theme.ok:sBeh>=60?theme.warn:theme.bad }}>{sBeh}</p>
                        <p style={{ fontSize:10, color:theme.muted }}>{t('behavior')}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          {selected ? (
            <div>
              <Card pad={24} style={{ marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:18 }}>
                  <Avatar name={selected.name} img={selected.img} size={66} accent={theme.gold} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <h3 style={{ fontSize:20, fontWeight:800, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{selected.name}</h3>
                    <p style={{ fontSize:13, color:theme.muted }} dir="ltr">{selected.accessKey}</p>
                    <p style={{ fontSize:13, color:theme.brown, marginTop:3 }}>{selected.academicYear||''}</p>
                  </div>
                  <ScoreRing value={beh} size={88} label={t('behavior')} />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:16, paddingTop:16, borderTop:`1px solid ${theme.lineSoft}` }}>
                  <span style={{ fontSize:13, fontWeight:700, color:theme.brown }}>{t('behavior')}:</span>
                  {editBeh ? (
                    <React.Fragment>
                      <input type="number" min="0" max="100" value={beh} onChange={e=>actions.updateBehavior(selected.accessKey, parseInt(e.target.value)||0)} style={{ width:90, padding:'7px 10px', borderRadius:9, border:`1px solid ${theme.line}`, fontSize:15, fontWeight:700, textAlign:'center', color:theme.ink, fontFamily:'Cairo, sans-serif', outline:'none' }} />
                      <Btn size="sm" variant="primary" icon="check" onClick={()=>setEditBeh(false)}>{t('save')}</Btn>
                    </React.Fragment>
                  ) : <Btn size="sm" variant="soft" icon="edit" onClick={()=>setEditBeh(true)}>{t('edit')}</Btn>}
                </div>
              </Card>
              <Card pad={20}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}><Icon name="book" size={17} color={theme.primary} /><h4 style={{ fontSize:15, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('gradeRecord')}</h4><Badge tone="neutral">{grades.length}</Badge></div>
                  <Btn size="sm" variant="primary" icon="plus" onClick={openNew}>{t('addGrade')}</Btn>
                </div>
                {grades.length===0 ? <p style={{ fontSize:13, textAlign:'center', color:theme.muted, padding:'20px 0' }}>{t('noGrades')}</p> : (
                  <div style={{ display:'grid', gap:8 }}>
                    {grades.map(g=>{
                      const pct = g.maxScore ? Math.round((parseFloat(g.score)/g.maxScore)*100) : null;
                      const col = pct==null?theme.primary:pct>=85?theme.ok:pct>=60?theme.warn:theme.bad;
                      return (
                        <div key={g.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:11, background:theme.paperAlt }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:14, fontWeight:600, color:theme.ink }}>{g.subject}</p>
                            {g.notes && <p style={{ fontSize:12, color:theme.muted }}>{g.notes}</p>}
                          </div>
                          <span style={{ fontSize:18, fontWeight:800, color:col, fontFamily:'Cairo, sans-serif' }}>{g.score}<span style={{ fontSize:12, color:theme.muted, fontWeight:400 }}>/{g.maxScore}</span></span>
                          <button onClick={()=>openEdit(g)} style={{ width:30, height:30, borderRadius:8, background:theme.creamDeep, border:'none', color:theme.primary, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="edit" size={14} /></button>
                          <button onClick={()=>actions.deleteGrade(g.id)} style={{ width:30, height:30, borderRadius:8, background:theme.badBg, border:'none', color:theme.bad, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="trash" size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:380, color:theme.muted }}>
              <Icon name="gradCap" size={42} color={theme.mutedSoft} style={{ marginBottom:12 }} />
              <p style={{ fontSize:14 }}>{t('selectStudentView')}</p>
            </div>
          )}
        </div>

        {gradeModal && selected && (
          <Modal title={gradeModal.id?t('editGrade'):t('addGrade')} onClose={()=>setGradeModal(null)} width={400}>
            <div style={{ display:'grid', gap:14 }}>
              <Field label={t('subject')} required><Input value={gForm.subject} onChange={e=>setGForm({...gForm,subject:e.target.value})} /></Field>
              <Field label={t('score')} required hint={lang==='ar'?'من 100':'out of 100'}><Input value={gForm.score} onChange={e=>setGForm({...gForm,score:e.target.value})} placeholder="92" dir="ltr" style={{ textAlign:lang==='ar'?'right':'left' }} /></Field>
              <Field label={lang==='ar'?'ملاحظات':'Notes'}><Input value={gForm.notes} onChange={e=>setGForm({...gForm,notes:e.target.value})} /></Field>
              <div style={{ display:'flex', gap:10 }}>
                <Btn full variant="soft" onClick={()=>setGradeModal(null)}>{t('cancel')}</Btn>
                <Btn full variant="primary" onClick={saveGrade}>{t('save')}</Btn>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  window.MgmtTools = { SchedulesTab, AnnouncementsTab, CloudTab, LookupTab };
})();
