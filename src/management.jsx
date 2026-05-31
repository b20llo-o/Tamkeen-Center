/* =========================================================================
   Management / Director dashboard — window.Dashboards.ManagementDashboard
   ========================================================================= */
(function () {
  const { theme, L, Icon } = window.TC;
  const { Avatar, Btn, Badge, Card, EmptyState, Field, Input, Modal } = window.UI;
  const { DashShell, InboxView, downloadScheduleCSV, CloudView } = window.Dash;
  const { SchedulesTab, AnnouncementsTab, LookupTab } = window.MgmtTools;
  const { useState } = React;

  function PeopleList({ lang, list, accent, onAdd, onDelete, role, db, onSelect, selId, t }) {
    const [q, setQ] = useState('');
    const filtered = list.filter(u=>u.name.includes(q)||u.accessKey.includes(q.toUpperCase()));
    return (
      <div>
        <div style={{ position:'relative', marginBottom:12 }}>
          <Icon name="search" size={15} color={theme.muted} style={{ position:'absolute', insetInlineStart:12, top:'50%', transform:'translateY(-50%)' }} />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search')} style={{ paddingInlineStart:36 }} />
        </div>
        <div style={{ display:'grid', gap:8 }}>
          {filtered.length===0 ? <p style={{ textAlign:'center', fontSize:13, color:theme.muted, padding:'24px 0' }}>{role==='teacher'?t('noTeachers'):t('noAdmins')}</p> :
            filtered.map(u=>{
              const on = onSelect && selId===u.accessKey;
              return (
                <Card key={u.accessKey} pad={12} onClick={onSelect?()=>onSelect(u.accessKey):undefined} style={{ background:on?theme.creamDeep:theme.paper }}>
                  <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                    <Avatar name={u.name} img={u.img} size={38} accent={accent} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13.5, fontWeight:600, color:theme.ink }}>{u.name}</p>
                      <span style={{ fontSize:11.5, color:theme.muted }} dir="ltr">{u.accessKey}</span>
                    </div>
                    <button onClick={(e)=>{e.stopPropagation();onDelete(u.accessKey);}} style={{ background:'none', border:'none', cursor:'pointer', color:theme.bad, padding:5 }}><Icon name="trash" size={15} /></button>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    );
  }

  function ManagementDashboard({ user, lang, setLang, db, actions, onLogout, onHome }) {
    const t = L(lang);
    const isDirector = user.role==='director';
    const [active, setActive] = useState('teachers');
    const uid = user.accessKey;

    const inbox = db.sharedItems.filter(i=>i.toUserId===uid);
    const unread = inbox.filter(i=>!i.isRead).length;
    const teachers = db.users.filter(u=>u.role==='teacher');
    const admins = db.users.filter(u=>u.role==='management');
    const students = db.users.filter(u=>u.role==='student');

    const [addModal, setAddModal] = useState(null); // 'teacher'|'management'
    const [form, setForm] = useState({ name:'', accessKey:'', password:'', phone:'', email:'' });
    const [selTeacher, setSelTeacher] = useState(null);
    const [delModal, setDelModal] = useState(false);
    const [del, setDel] = useState({ type:'subject', title:'', description:'', subjectName:'', className:'', studentIds:[] });

    const tabs = [
      { id:'inbox', label:t('inbox'), icon:'inbox', badge:unread },
      ...(isDirector ? [{ id:'admins', label:t('admins'), icon:'briefcase', badge:0 }] : []),
      { id:'teachers', label:t('teachers'), icon:'users', badge:0 },
      { id:'students', label:t('students'), icon:'gradCap', badge:0 },
      { id:'schedules', label:t('createSchedules'), icon:'calendar', badge:0 },
      { id:'announcements', label:t('createAnnouncements'), icon:'megaphone', badge:0 },
      { id:'cloud', label:t('cloudSystem'), icon:'cloud', badge:0 },
    ];

    const openAdd = (role)=>{ setForm({ name:'', accessKey:'', password:'', phone:'', email:'' }); setAddModal(role); };
    const saveAdd = ()=>{ if(!form.name||!form.accessKey||!form.password) return; actions.addUser(addModal, form); setAddModal(null); };

    const teacherDelegations = (id)=>db.delegations.filter(d=>d.teacherId===id);
    const selectedTeacher = teachers.find(x=>x.accessKey===selTeacher);
    const saveDelegation = ()=>{
      if (del.type==='students' ? del.studentIds.length===0 : !del.title) return;
      actions.addDelegation(selTeacher, del, uid);
      setDel({ type:'subject', title:'', description:'', subjectName:'', className:'', studentIds:[] });
      setDelModal(false);
    };
    const toggleDelStudent = (k)=>setDel(p=>({ ...p, studentIds:p.studentIds.includes(k)?p.studentIds.filter(x=>x!==k):[...p.studentIds,k] }));

    return (
      <DashShell user={user} lang={lang} setLang={setLang} panelLabel={isDirector?t('directorPanel'):t('adminPanel')} accent={theme.primaryDeep}
        tabs={tabs} active={active} setActive={setActive} onLogout={onLogout} onHome={onHome}>

        {active==='inbox' && <InboxView items={inbox} users={db.users} lang={lang} onMarkRead={actions.markRead} onDownloadSchedule={downloadScheduleCSV} />}

        {active==='admins' && isDirector && (
          <div style={{ maxWidth:560, margin:'0 auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}><Icon name="briefcase" size={19} color={theme.primary} /><h2 style={{ fontSize:18, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('admins')}</h2><Badge tone="neutral">{admins.length}</Badge></div>
              <Btn size="sm" variant="primary" icon="plus" onClick={()=>openAdd('management')}>{t('addAdmin')}</Btn>
            </div>
            <PeopleList lang={lang} list={admins} accent={theme.primaryDeep} role="management" onDelete={actions.deleteUser} db={db} t={t} />
          </div>
        )}

        {active==='teachers' && (
          <div style={{ display:'flex', gap:24 }} className="tc-split">
            <div style={{ width:300, flexShrink:0 }} className="tc-split-aside">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}><Icon name="users" size={18} color={theme.primary} /><h3 style={{ fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{t('teachers')}</h3><Badge tone="neutral">{teachers.length}</Badge></div>
                <Btn size="sm" variant="primary" icon="plus" onClick={()=>openAdd('teacher')}>{t('add')}</Btn>
              </div>
              <PeopleList lang={lang} list={teachers} accent={theme.tan} role="teacher" onDelete={actions.deleteUser} db={db} t={t} onSelect={setSelTeacher} selId={selTeacher} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              {selectedTeacher ? (
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <Avatar name={selectedTeacher.name} img={selectedTeacher.img} size={56} accent={theme.tan} />
                      <div><h2 style={{ fontSize:19, fontWeight:800, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{selectedTeacher.name}</h2><p style={{ fontSize:13, color:theme.muted }}>{(selectedTeacher.specializations||[]).join('، ')}</p></div>
                    </div>
                    <Btn variant="primary" icon="plus" onClick={()=>setDelModal(true)}>{t('newDelegation')}</Btn>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:12 }}><Icon name="clipboard" size={17} color={theme.primary} /><h3 style={{ fontSize:15, fontWeight:700, color:theme.ink }}>{t('delegations')}</h3></div>
                  {teacherDelegations(selTeacher).length===0 ? <EmptyState icon="clipboard" title={t('noTasks')} /> : (
                    <div style={{ display:'grid', gap:10 }}>
                      {teacherDelegations(selTeacher).map(d=>(
                        <Card key={d.id} pad={16}>
                          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                                <Badge tone="gold">{d.type==='subject'?t('typeSubject'):d.type==='class'?t('typeClass'):t('typeStudents')}</Badge>
                                <Badge tone="ok">{t('active')}</Badge>
                              </div>
                              <h4 style={{ fontSize:14.5, fontWeight:700, color:theme.ink, marginBottom:5 }}>{d.title}</h4>
                              <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                                {d.subjectName && <span style={{ fontSize:12, padding:'3px 9px', borderRadius:8, background:theme.paperAlt, color:theme.brown }}>{d.subjectName}</span>}
                                {d.studentIds?.length>0 && <span style={{ fontSize:12, padding:'3px 9px', borderRadius:8, background:theme.paperAlt, color:theme.brown }}>{d.studentIds.length} {t('students')}</span>}
                              </div>
                            </div>
                            <button onClick={()=>actions.removeDelegation(d.id)} style={{ background:'none', border:'none', cursor:'pointer', color:theme.bad, padding:4 }}><Icon name="trash" size={15} /></button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:360, color:theme.muted }}>
                  <Icon name="users" size={40} color={theme.mutedSoft} style={{ marginBottom:12 }} />
                  <p style={{ fontSize:14 }}>{lang==='ar'?'اختر معلماً لإدارة توكيلاته':'Select a teacher to manage delegations'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {active==='schedules' && <SchedulesTab lang={lang} db={db} actions={actions} uid={uid} />}
        {active==='announcements' && <AnnouncementsTab lang={lang} db={db} actions={actions} uid={uid} />}
        {active==='cloud' && <CloudView lang={lang} db={db} actions={actions} uid={uid} canShare />}
        {active==='students' && <LookupTab lang={lang} db={db} actions={actions} />}

        {/* add user modal */}
        {addModal && (
          <Modal title={addModal==='teacher'?t('addTeacher'):t('addAdmin')} onClose={()=>setAddModal(null)} width={420}>
            <div style={{ display:'grid', gap:14 }}>
              <Field label={t('name')} required><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></Field>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label={t('accessKey')} required><Input value={form.accessKey} onChange={e=>setForm({...form,accessKey:e.target.value})} placeholder={addModal==='teacher'?'T102':'K102'} dir="ltr" /></Field>
                <Field label={t('password')} required><Input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="****" dir="ltr" /></Field>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label={t('phone')}><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} dir="ltr" /></Field>
                <Field label={t('email')}><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} dir="ltr" /></Field>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <Btn full variant="soft" onClick={()=>setAddModal(null)}>{t('cancel')}</Btn>
                <Btn full variant="primary" onClick={saveAdd}>{t('add')}</Btn>
              </div>
            </div>
          </Modal>
        )}

        {/* delegation modal */}
        {delModal && selectedTeacher && (
          <Modal title={t('newDelegation')} onClose={()=>setDelModal(false)} width={480}>
            <div style={{ display:'grid', gap:16 }}>
              <Field label={t('delegationType')}>
                <div style={{ display:'flex', gap:8 }}>
                  {[['subject',t('typeSubject')],['class',t('typeClass')],['students',t('typeStudents')]].map(([v,lab])=>{
                    const on=del.type===v;
                    return <button key={v} onClick={()=>setDel({...del,type:v})} style={{ flex:1, padding:'9px', borderRadius:10, border:`1.5px solid ${on?theme.primary:theme.line}`, background:on?theme.creamDeep:theme.paper, cursor:'pointer', fontFamily:'Cairo, sans-serif', fontWeight:600, fontSize:13, color:on?theme.ink:theme.brown }}>{lab}</button>;
                  })}
                </div>
              </Field>
              {del.type!=='students' && <Field label={t('title')} required><Input value={del.title} onChange={e=>setDel({...del,title:e.target.value})} /></Field>}
              <Field label={t('subjectName')}><Input value={del.subjectName} onChange={e=>setDel({...del,subjectName:e.target.value})} /></Field>
              {del.type==='students' && (
                <Field label={t('selectStudents')}>
                  <div style={{ display:'grid', gap:6, maxHeight:200, overflowY:'auto' }}>
                    {students.map(s=>{
                      const on=del.studentIds.includes(s.accessKey);
                      return (
                        <button key={s.accessKey} onClick={()=>toggleDelStudent(s.accessKey)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, background:on?theme.goldSoft:theme.paperAlt, border:'none', cursor:'pointer', textAlign:lang==='ar'?'right':'left' }}>
                          <Avatar name={s.name} img={s.img} size={30} accent={theme.gold} />
                          <span style={{ flex:1, fontSize:13, fontWeight:600, color:theme.ink }}>{s.name}</span>
                          <span style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${on?theme.primary:theme.line}`, background:on?theme.primary:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>{on && <Icon name="check" size={12} color="#fff" />}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <Btn full variant="soft" onClick={()=>setDelModal(false)}>{t('cancel')}</Btn>
                <Btn full variant="primary" onClick={saveDelegation}>{t('assign')}</Btn>
              </div>
            </div>
          </Modal>
        )}
      </DashShell>
    );
  }

  window.Dashboards = window.Dashboards || {};
  window.Dashboards.ManagementDashboard = ManagementDashboard;
})();
