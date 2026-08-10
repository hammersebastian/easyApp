import { IonButton, IonIcon } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AppPage } from '../components/AppPage';
import { LoadingState } from '../components/LoadingState';
import { learningRepository } from '../repositories';

export function TrainingComposerPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();
  const areas = useQuery({ queryKey: ['taxonomy'], queryFn: () => learningRepository.getTaxonomy() });
  const available = useMemo(
    () => areas.data?.flatMap((area) => area.subjects).filter((subject) => selected.has(subject.id)).reduce((sum, subject) => sum + subject.publishedCount, 0) ?? 0,
    [areas.data, selected],
  );

  const toggleArea = (areaId: string) => {
    const area = areas.data?.find((candidate) => candidate.id === areaId);
    if (!area) return;
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = area.subjects.every((subject) => next.has(subject.id));
      area.subjects.forEach((subject) => allSelected ? next.delete(subject.id) : next.add(subject.id));
      return next;
    });
  };
  const toggleSubject = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const start = async () => {
    setBusy(true); setError('');
    try {
      const session = await learningRepository.startSession('training', [...selected]);
      history.push(`/quiz/${session.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Training konnte nicht gestartet werden.');
    } finally { setBusy(false); }
  };

  return (
    <AppPage title="Training zusammenstellen" backHref="/home">
      <div className="page-container--narrow">
        <p className="lead">Wähle ganze Bereiche oder kombiniere einzelne Sparten. Deine Runde enthält genau zehn Fragen.</p>
        {areas.isLoading ? <LoadingState /> : (
          <div className="area-list">
            {areas.data?.map((area) => {
              const count = area.subjects.filter((subject) => selected.has(subject.id)).length;
              const all = count === area.subjects.length;
              const open = expanded.has(area.id);
              return (
                <section className="area-card" key={area.id}>
                  <div className="area-card__header">
                    <span className="area-code">{area.code}</span>
                    <label className="check-row">
                      <input type="checkbox" checked={all} ref={(node) => { if (node) node.indeterminate = count > 0 && !all; }} onChange={() => toggleArea(area.id)} />
                      <span><strong>{area.name}</strong><br /><small className="muted">{count} von {area.subjects.length} Sparten</small></span>
                    </label>
                    <IonButton fill="clear" onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(area.id)) next.delete(area.id); else next.add(area.id); return next; })} aria-expanded={open} aria-label={`${area.name} ${open ? 'zuklappen' : 'aufklappen'}`}>
                      <IonIcon icon={open ? chevronUpOutline : chevronDownOutline} />
                    </IonButton>
                  </div>
                  {open && <div className="subject-list">{area.subjects.map((subject) => (
                    <label className="check-row" key={subject.id}>
                      <input type="checkbox" checked={selected.has(subject.id)} onChange={() => toggleSubject(subject.id)} />
                      <span>{subject.name} <small className="muted">({subject.publishedCount})</small></span>
                    </label>
                  ))}</div>}
                </section>
              );
            })}
          </div>
        )}
        <div className="sticky-action">
          <div className="spread">
            <div><strong>{available} Fragen verfügbar</strong><br /><small className="muted">{available < 10 ? `Noch ${10 - available} erforderlich` : 'Bereit für deine Runde'}</small></div>
            <IonButton onClick={start} disabled={available < 10 || busy}>{busy ? 'Startet …' : 'Training starten'}</IonButton>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      </div>
    </AppPage>
  );
}
