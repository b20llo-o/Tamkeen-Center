/* =========================================================================
   Student dashboard — window.Dashboards.StudentDashboard
   ========================================================================= */
(function () {
  const { theme, L, Icon, fmtDate } = window.TC;
  const { Avatar, Btn, Badge, Card, EmptyState, ScoreRing } = window.UI;
  const { DashShell, InboxView, ScheduleTable, downloadScheduleCSV, AnnouncementsView } = window.Dash;
  const { useState } = React;

  function StudentDashboard({ user, lang, setLang, db, actions, onLogout, onHome }) {
    const t = L(lang);
    const [active, setActive] = useState('inbox');
    const uid = user.accessKey;

    const inbox = db.sharedItems.filter(i=>i.toUserId===uid);
    const grades = db.grades.filter(g=>g.studentId===uid);
    const assignments = db.assignments.filter(a=>a.studentId===uid);
    const behavior = db.behaviorScores[uid] || 0;
    const scheduleItem = [...inbox].reverse().find(i=>i.itemType==='schedule' && i.scheduleData);
    const unread = inbox.filter(i=>!i.isRead).length;

    const tabs = [
      { id:'inbox', label:t('inbox'), icon:'inbox', badge:unread },
      { id:'announcements', label:t('announcements'), icon:'megaphone', badge:0 },
      { id:'schedule', label:t('mySchedule'), icon:'calendar', badge:0 },
      { id:'grades', label:t('myGrades'), icon:'book', badge:0 },
      { id:'assignments', label:t('myAssignments'), icon:'fileText', badge:assignments.length },
      { id:'profile', label:t('myProfile'), icon:'user', badge:0 },
    ];

    const statusConf = null;

    const Section = ({ icon, title, extra }) => (
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <Icon name={icon} size={20} color={theme.primary} />
        <h2 style={{ fontSize:19, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{title}</h2>
        {extra}
      </div>
    );

    return (
      <DashShell user={user} lang={lang} setLang={setLang} panelLabel={t('studentPanel')} accent={theme.gold}
        tabs={tabs} active={active} setActive={setActive} onLogout={onLogout} onHome={onHome}>

        {active==='inbox' && <InboxView items={inbox} users={db.users} lang={lang} onMarkRead={actions.markRead} onDownloadSchedule={downloadScheduleCSV} />}

        {active==='announcements' && <AnnouncementsView announcements={db.announcements} role="student" lang={lang} />}

        {active==='schedule' && (
          <div style={{ maxWidth:820, margin:'0 auto' }}>
            <Section icon="calendar" title={t('mySchedule')} />
            {scheduleItem ? (
              <Card pad={22}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <h3 style={{ fontSize:16, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{scheduleItem.itemName}</h3>
                  <Btn size="sm" variant="soft" icon="download" onClick={()=>downloadScheduleCSV(scheduleItem)}>{t('downloadExcel')}</Btn>
                </div>
                <ScheduleTable data={scheduleItem.scheduleData} />
              </Card>
            ) : <EmptyState icon="calendar" title={lang==='ar'?'لا يوجد جدول بعد':'No schedule yet'} body={lang==='ar'?'سيظهر جدولك هنا عند إرساله من الإدارة':'Your schedule will appear here once sent'} />}
          </div>
        )}

        {active==='grades' && (
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            <Section icon="book" title={t('myGrades')} />
            {grades.length===0 ? <EmptyState icon="award" title={t('noGrades')} body={t('noGradesB')} /> : (
              <Card pad={0} style={{ overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, padding:'14px 20px', background:theme.creamDeep }}>
                  <Icon name="book" size={16} color={theme.primary} />
                  <span style={{ fontWeight:700, fontSize:14, color:theme.ink }}>{t('gradeRecord')}</span>
                  <span style={{ fontSize:12.5, color:theme.muted }}>{grades.length} {t('subject')}</span>
                </div>
                {grades.map((g,i)=>{
                  const pct = g.maxScore ? Math.round((parseFloat(g.score)/g.maxScore)*100) : null;
                  const col = pct==null?theme.primary:pct>=85?theme.ok:pct>=60?theme.warn:theme.bad;
                  return (
                    <div key={g.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px 20px', borderTop:i>0?`1px solid ${theme.lineSoft}`:'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:13 }}>
                        <div style={{ width:38, height:38, borderRadius:11, background:theme.paperAlt, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="book" size={17} color={theme.primary} /></div>
                        <div><p style={{ fontSize:14.5, fontWeight:600, color:theme.ink }}>{g.subject}</p>{g.notes && <p style={{ fontSize:12, color:theme.muted }}>{g.notes}</p>}</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <span style={{ fontSize:21, fontWeight:800, color:col, fontFamily:'Cairo, sans-serif' }}>{g.score}</span>
                        {g.maxScore && <span style={{ fontSize:13, color:theme.muted }}> / {g.maxScore}</span>}
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>
        )}

        {active==='assignments' && (
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            <Section icon="fileText" title={t('myAssignments')} extra={assignments.length>0 && <Badge tone="gold">{assignments.length}</Badge>} />
            {assignments.length===0 ? <EmptyState icon="fileText" title={t('noAssignments')} body={t('noAssignmentsB')} /> : (
              <div style={{ display:'grid', gap:12 }}>
                {[...assignments].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(a=>{
                  const teacher = db.users.find(u=>u.accessKey===a.assignedBy);
                  return (
                    <Card key={a.id} pad={20} style={{ display:'flex', gap:15, alignItems:'flex-start' }}>
                      <div style={{ width:44, height:44, borderRadius:13, background:theme.goldSoft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon name="clipboard" size={20} color={theme.primaryDeep} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <h3 style={{ fontSize:15.5, fontWeight:700, color:theme.ink, fontFamily:'Cairo, sans-serif', marginBottom:6 }}>{a.title}</h3>
                        {a.description && <p style={{ fontSize:13.5, color:theme.brown, lineHeight:1.7, marginBottom:10 }}>{a.description}</p>}
                        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', fontSize:12.5, color:theme.muted }}>
                          {a.dueDate && <span style={{ display:'flex', alignItems:'center', gap:5 }}><Icon name="clock" size={13} color={theme.primary} /> {t('due')}: {fmtDate(a.dueDate, lang)}</span>}
                          {teacher && <span style={{ display:'flex', alignItems:'center', gap:5 }}><Icon name="gradCap" size={13} color={theme.primary} /> {teacher.name}</span>}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {active==='profile' && (
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            <Section icon="user" title={t('myProfile')} />
            <Card pad={26} style={{ marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24 }}>
                <Avatar name={user.name} img={user.img} size={84} accent={theme.gold} />
                <div>
                  <h3 style={{ fontSize:22, fontWeight:800, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{user.name}</h3>
                  <p style={{ fontSize:14, color:theme.muted }} dir="ltr">{uid}</p>
                  <Badge tone="gold" style={{ marginTop:6 }}>{t('student')}</Badge>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} className="tc-form-grid">
                {[['mail',t('email'),user.email,'ltr'],['phone',t('phone'),user.phone,'ltr'],['book',t('academicYear'),user.academicYear||t('notSet')],['calendar',t('joined'),fmtDate(user.createdAt||Date.now(),lang)]].map(([ic,lab,val,dir],i)=>(
                  <div key={i} style={{ padding:14, borderRadius:12, background:theme.paperAlt }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}><Icon name={ic} size={14} color={theme.primary} /><span style={{ fontSize:12, color:theme.muted }}>{lab}</span></div>
                    <p style={{ fontSize:14, fontWeight:600, color:theme.ink }} dir={dir}>{val||'—'}</p>
                  </div>
                ))}
              </div>
            </Card>
            <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:14 }} className="tc-stats-grid">
              <Card pad={20} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <ScoreRing value={behavior} size={104} label={t('behavior')} />
              </Card>
              <Card pad={20} style={{ textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <Icon name="book" size={24} color={theme.primary} style={{ margin:'0 auto 8px' }} />
                <p style={{ fontSize:28, fontWeight:800, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{grades.length}</p>
                <p style={{ fontSize:12.5, color:theme.muted }}>{t('grades')}</p>
              </Card>
              <Card pad={20} style={{ textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <Icon name="fileText" size={24} color={theme.primary} style={{ margin:'0 auto 8px' }} />
                <p style={{ fontSize:28, fontWeight:800, color:theme.ink, fontFamily:'Cairo, sans-serif' }}>{assignments.length}</p>
                <p style={{ fontSize:12.5, color:theme.muted }}>{t('assignments')}</p>
              </Card>
            </div>
          </div>
        )}
      </DashShell>
    );
  }

  window.Dashboards = window.Dashboards || {};
  window.Dashboards.StudentDashboard = StudentDashboard;
})();
