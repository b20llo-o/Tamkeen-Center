/* =========================================================================
   Teacher dashboard — window.Dashboards.TeacherDashboard
   ========================================================================= */
(function () {
  const { theme, L, Icon, fmtDate, roleLabel } = window.TC;
  const { Avatar, Btn, Badge, Card, EmptyState, Field, Input, Modal } = window.UI;
  const { DashShell, InboxView, downloadScheduleCSV, AnnouncementsView, CloudView } = window.Dash;
  const { useState, useRef } = React;

  function TeacherDashboard({ user, lang, setLang, db, actions, onLogout, onHome }) {
    const t = L(lang);
    const [active, setActive] = useState('inbox');
    const uid = user.accessKey;
    const fileRef = useRef(null);

    const inbox = db.sharedItems.filter(i=>i.toUserId===uid);
    const unread = inbox.filter(i=>!i.isRead).length;
    const myDelegations = db.delegations.filter(d=>d.teacherId===uid);
    const cloud = db.cloudItems.filter(c=>c.ownerId===uid);

    // delegated student ids
    const studentIds = Array.from(new Set(myDelegations.flatMap(d=>d.studentIds||[])));
    const students = studentIds.map(id=>db.users.find(u=>u.accessKey===id)).filter(Boolean);

    const [selId, setSelId] = useState(null);
    const [q, setQ] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [gradeModal, setGradeModal] = useState(false);
    const [hwModal, setHwModal] = useState(false);
    const [editBeh, setEditBeh] = useState(false);
    const [newGrade, setNewGrade] = useState({ subject:'', score:'' });
    const [newHw, setNewHw] = useState({ title:'', dueDate:'' });

    const selected = students.find(s=>s.accessKey===selId);
    const selInfo = (id) => {
      const del = myDelegations.find(d=>(d.studentIds||[]).includes(id));
      return { subject: del?.subjectName, className: del?.className };
    };

    const tabs = [
      { id:'inbox', label:t('inbox'), icon:'inbox', badge:unread },
      { id:'announcements', label:t('announcements'), icon:'megaphone', badge:0 },
      { id:'tasks', label:t('delegatedTasks'), icon:'clipboard', badge:0 },
      { id:'cloud', label:t('cloudSystem'), icon:'cloud', badge:0 },
      { id:'students', label:t('studentsPage'), icon:'gradCap', badge:0 },
    ];

    const filtered = students.filter(s=>s.name.includes(q)||s.accessKey.includes(q.toUpperCase()));

    return (
      <DashShell user={user} lang={lang} setLang={setLang} panelLabel={t('teacherPanel')} accent={theme.tan}
        tabs={tabs} active={active} setActive={setActive} onLogout={onLogout} onHome={onHome}>

        {active==='inbox' && <InboxView items={inbox} users={db.users} lang={lang} onMarkRead={actions.markRead} onDownloadSchedule={downloadScheduleCSV} />}

        {active==='announcements' && <AnnouncementsView announcements={db.announcements} role="teacher" lang={lang} />}

        {active==='tasks' && (
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <Icon name="clipboard" size={20} color={theme.primary} />
              <h2 style={{ fontSize:19, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('tasksFromAdmin')}</h2>
              <Badge tone="neutral">{myDelegations.length}</Badge>
            </div>
            {myDelegations.length===0 ? <EmptyState icon="briefcase" title={t('noTasks')} /> : (
              <div style={{ display:'grid', gap:12 }}>
                {myDelegations.map(d=>(
                  <Card key={d.id} pad={20}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                      <Badge tone="gold">{d.type==='subject'?t('typeSubject'):d.type==='class'?t('typeClass'):t('typeStudents')}</Badge>
                      <Badge tone={d.status==='active'?'ok':'neutral'}>{d.status==='active'?t('active'):t('completed')}</Badge>
                    </div>
                    <h3 style={{ fontSize:15.5, fontWeight:700, color:theme.ink, marginBottom:6, fontFamily:'Cairo, sans-serif' }}>{d.title}</h3>
                    {d.description && <p style={{ fontSize:13.5, color:theme.brown, lineHeight:1.7, marginBottom:12 }}>{d.description}</p>}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {d.subjectName && <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, padding:'5px 11px', borderRadius:9, background:theme.paperAlt, color:theme.brown }}><Icon name="book" size={13} color={theme.primary} />{d.subjectName}</span>}
                      {d.className && <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, padding:'5px 11px', borderRadius:9, background:theme.paperAlt, color:theme.brown }}><Icon name="gradCap" size={13} color={theme.primary} />{d.className}</span>}
                      {d.studentIds?.length>0 && <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, padding:'5px 11px', borderRadius:9, background:theme.paperAlt, color:theme.brown }}><Icon name="users" size={13} color={theme.primary} />{d.studentIds.length} {t('students')}</span>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {active==='cloud' && <CloudView lang={lang} db={db} actions={actions} uid={uid} canShare />}

        {active==='students' && (
          <div style={{ display:'flex', gap:24 }} className="tc-split">
            <div style={{ width:300, flexShrink:0 }} className="tc-split-aside">
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
                <Icon name="gradCap" size={18} color={theme.primary} /><h3 style={{ fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('myStudents')}</h3><Badge tone="neutral">{students.length}</Badge>
              </div>
              <div style={{ position:'relative', marginBottom:12 }}>
                <Icon name="search" size={15} color={theme.muted} style={{ position:'absolute', insetInlineStart:12, top:'50%', transform:'translateY(-50%)' }} />
                <Input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search')} style={{ paddingInlineStart:36 }} />
              </div>
              <div style={{ display:'grid', gap:8 }}>
                {filtered.length===0 ? <p style={{ textAlign:'center', fontSize:13, color:theme.muted, padding:'24px 0' }}>{t('noDelegated')}</p> :
                  filtered.map(s=>{
                    const beh = db.behaviorScores[s.accessKey]||0;
                    const info = selInfo(s.accessKey);
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
                            <p style={{ fontSize:14, fontWeight:800, color:beh>=80?theme.ok:beh>=60?theme.warn:theme.bad }}>{beh}</p>
                            <p style={{ fontSize:10, color:theme.muted }}>{t('behavior')}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              {selected ? (() => {
                const beh = db.behaviorScores[selected.accessKey]||0;
                const sGrades = db.grades.filter(g=>g.studentId===selected.accessKey);
                const sAssign = db.assignments.filter(a=>a.studentId===selected.accessKey);
                const info = selInfo(selected.accessKey);
                return (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22 }}>
                      <Avatar name={selected.name} img={selected.img} size={62} accent={theme.gold} />
                      <div><h2 style={{ fontSize:20, fontWeight:800, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{selected.name}</h2><p style={{ fontSize:13.5, color:theme.muted }}>{info.className||''} {info.subject?`• ${info.subject}`:''}</p></div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:18 }} className="tc-stats-grid">
                      <Card pad={18}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                          <h4 style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:theme.ink }}><Icon name="star" size={14} color={theme.primary} />{t('behavior')}</h4>
                          <button onClick={()=>setEditBeh(!editBeh)} style={{ fontSize:11.5, fontWeight:600, background:theme.creamDeep, border:'none', borderRadius:7, padding:'3px 9px', color:theme.primary, cursor:'pointer' }}>{editBeh?t('save'):t('edit')}</button>
                        </div>
                        {editBeh ? (
                          <input type="number" min="0" max="100" value={beh} onChange={e=>actions.updateBehavior(selected.accessKey, parseInt(e.target.value)||0)} style={{ width:'100%', fontSize:26, fontWeight:800, textAlign:'center', padding:'6px', borderRadius:10, border:`1px solid ${theme.line}`, color:theme.ink, fontFamily:'Cairo, sans-serif', outline:'none' }} />
                        ) : <p style={{ fontSize:32, fontWeight:800, textAlign:'center', color:beh>=80?theme.ok:beh>=60?theme.warn:theme.bad, fontFamily:'Cairo, sans-serif' }}>{beh}<span style={{ fontSize:14, color:theme.muted, fontWeight:400 }}>/100</span></p>}
                      </Card>
                      <Card pad={18} style={{ textAlign:'center' }}><h4 style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center', fontSize:13, fontWeight:700, color:theme.ink, marginBottom:6 }}><Icon name="book" size={14} color={theme.primary} />{t('grades')}</h4><p style={{ fontSize:32, fontWeight:800, color:theme.primary, fontFamily:'Cairo, sans-serif' }}>{sGrades.length}</p></Card>
                      <Card pad={18} style={{ textAlign:'center' }}><h4 style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center', fontSize:13, fontWeight:700, color:theme.ink, marginBottom:6 }}><Icon name="fileText" size={14} color={theme.primary} />{t('assignments')}</h4><p style={{ fontSize:32, fontWeight:800, color:theme.primary, fontFamily:'Cairo, sans-serif' }}>{sAssign.length}</p></Card>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="tc-form-grid">
                      <Card pad={18}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}><h4 style={{ fontSize:14, fontWeight:700, color:theme.ink }}>{t('grades')}</h4><Btn size="sm" variant="soft" icon="plus" onClick={()=>{setNewGrade({subject:info.subject||'',score:''});setGradeModal(true);}}>{t('add')}</Btn></div>
                        {sGrades.length===0 ? <p style={{ fontSize:12.5, textAlign:'center', color:theme.muted, padding:'16px 0' }}>{t('noGrades')}</p> :
                          sGrades.map(g=>(<div key={g.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:10, background:theme.paperAlt, marginBottom:6 }}><span style={{ fontSize:13, fontWeight:600, color:theme.ink }}>{g.subject}</span><Badge tone="gold">{g.score}{g.maxScore?`/${g.maxScore}`:''}</Badge></div>))}
                      </Card>
                      <Card pad={18}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}><h4 style={{ fontSize:14, fontWeight:700, color:theme.ink }}>{t('assignments')}</h4><Btn size="sm" variant="soft" icon="plus" onClick={()=>{setNewHw({title:'',dueDate:''});setHwModal(true);}}>{t('assign')}</Btn></div>
                        {sAssign.length===0 ? <p style={{ fontSize:12.5, textAlign:'center', color:theme.muted, padding:'16px 0' }}>{t('noAssignments')}</p> :
                          sAssign.map(a=>(<div key={a.id} style={{ padding:'9px 12px', borderRadius:10, background:theme.paperAlt, marginBottom:6 }}><div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}><span style={{ fontSize:13, fontWeight:600, color:theme.ink }}>{a.title}</span><button onClick={()=>actions.deleteAssignment(a.id)} title={t('delete')} style={{ width:26, height:26, borderRadius:7, background:theme.badBg, border:'none', color:theme.bad, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="check" size={15} /></button></div>{a.dueDate && <p style={{ fontSize:11.5, color:theme.muted, marginTop:4 }}>{t('due')}: {fmtDate(a.dueDate,lang)}</p>}</div>))}
                      </Card>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, color:theme.muted }}>
                  <Icon name="gradCap" size={42} color={theme.mutedSoft} style={{ marginBottom:14 }} />
                  <p style={{ fontSize:14 }}>{t('selectStudent')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {gradeModal && selected && (
          <Modal title={t('addGrade')} onClose={()=>setGradeModal(false)} width={380}>
            <div style={{ display:'grid', gap:14 }}>
              <Field label={t('subject')}><Input value={newGrade.subject} onChange={e=>setNewGrade({...newGrade,subject:e.target.value})} /></Field>
              <Field label={t('score')}><Input value={newGrade.score} onChange={e=>setNewGrade({...newGrade,score:e.target.value})} placeholder="92" /></Field>
              <div style={{ display:'flex', gap:10 }}>
                <Btn full variant="soft" onClick={()=>setGradeModal(false)}>{t('cancel')}</Btn>
                <Btn full variant="primary" onClick={()=>{ if(newGrade.subject&&newGrade.score){actions.addGrade(selected.accessKey,newGrade,uid);setGradeModal(false);} }}>{t('save')}</Btn>
              </div>
            </div>
          </Modal>
        )}
        {hwModal && selected && (
          <Modal title={t('assignHw')} onClose={()=>setHwModal(false)} width={380}>
            <div style={{ display:'grid', gap:14 }}>
              <Field label={t('hwTitle')}><Input value={newHw.title} onChange={e=>setNewHw({...newHw,title:e.target.value})} /></Field>
              <Field label={t('due')}><Input type="date" value={newHw.dueDate} onChange={e=>setNewHw({...newHw,dueDate:e.target.value})} dir="ltr" /></Field>
              <div style={{ display:'flex', gap:10 }}>
                <Btn full variant="soft" onClick={()=>setHwModal(false)}>{t('cancel')}</Btn>
                <Btn full variant="primary" onClick={()=>{ if(newHw.title){actions.assignHomework(selected.accessKey,newHw,uid);setHwModal(false);} }}>{t('assign')}</Btn>
              </div>
            </div>
          </Modal>
        )}
      </DashShell>
    );
  }

  window.Dashboards = window.Dashboards || {};
  window.Dashboards.TeacherDashboard = TeacherDashboard;
})();
