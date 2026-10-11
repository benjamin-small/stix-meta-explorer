import { useCallback, useEffect, useRef, useState } from 'react';
import { hackersById, labelOf } from '../../data/hackers';
import { readStoryScene, sceneDuration, storyFrames, storyScenes } from './story-scenes';
import StoryGraph from './StoryGraph';
import StoryImage from './StoryImage';
import { storyMedia } from './story-media';
import { useStoryNarration } from './useStoryNarration';
import './story.css';

export default function StoryWalkthrough({ onExplore }: { onExplore: (id: string) => void }) {
  const [step, setStep] = useState(readStoryScene);
  const [playing, setPlaying] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [sceneVisit, setSceneVisit] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ready, setReady] = useState(false);
  const [inspected, setInspected] = useState<string | null>(null);
  const elapsedRef = useRef(0);
  const scene = storyScenes[step];
  const frame = storyFrames[step];
  const complete = step === storyScenes.length - 1 && elapsed >= sceneDuration(step);

  const chooseScene = useCallback((next: number, automatic = false) => {
    if (!automatic) setPlaying(false);
    elapsedRef.current = 0;
    setElapsed(0);
    setInspected(null);
    setSpeechError('');
    setSceneVisit(visit => visit + 1);
    setStep(next);
    const url = new URL(window.location.href);
    url.searchParams.set('scene', storyScenes[next].id);
    url.hash = '';
    // Playback updates a shareable location without filling browser history.
    window.history[automatic ? 'replaceState' : 'pushState']({}, '', url);
  }, []);

  const speechSupported = useStoryNarration({
    sceneVisit,
    text: `${scene.title} ${scene.text} Reading the graph. ${scene.takeaway}`,
    enabled: readAloud,
    playing,
    onEnd: () => {
      if (step < storyScenes.length - 1) chooseScene(step + 1, true);
      else { elapsedRef.current = sceneDuration(step); setElapsed(sceneDuration(step)); setPlaying(false); }
    },
    onProgress: fraction => { elapsedRef.current = fraction * sceneDuration(step); setElapsed(elapsedRef.current); },
    onError: () => {
      setPlaying(false); setReadAloud(false);
      setSpeechError('Read aloud could not play. You can try it again, or press Play to continue without narration.');
    },
  });

  useEffect(() => {
    const restore = () => {
      setPlaying(false); setStep(readStoryScene()); setInspected(null);
      setSceneVisit(visit => visit + 1); setSpeechError('');
      setElapsed(0); elapsedRef.current = 0;
    };
    const hide = () => { if (document.hidden) setPlaying(false); };
    window.addEventListener('popstate', restore);
    document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('popstate', restore); document.removeEventListener('visibilitychange', hide); };
  }, []);

  useEffect(() => {
    if (!playing || readAloud) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      elapsedRef.current = Math.min(sceneDuration(step), elapsedRef.current + now - last);
      last = now;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= sceneDuration(step)) {
        if (step < storyScenes.length - 1) chooseScene(step + 1, true);
        else setPlaying(false);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, step, readAloud, chooseScene]);

  function inspect(id: string) { setInspected(id); }
  const object = inspected ? hackersById.get(inspected) : undefined;

  return <section className="story-walkthrough" aria-label="Story walkthrough">
    <div className="story-topline"><div><p className="case-eyebrow">A STORY TOLD THROUGH CONNECTIONS · PLOT SPOILERS</p><h2>Watch the story unfold.</h2></div><p>Start with one person. Follow the evidence.</p></div>
    <nav className="story-chapters" aria-label="Story scenes">
      {storyScenes.map((s, index) => <button key={s.id} aria-label={`Scene ${index + 1}: ${s.shortTitle}`} aria-current={index === step ? 'step' : undefined} className={index < step ? 'is-past' : ''} onClick={() => chooseScene(index)}><span>{String(index + 1).padStart(2, '0')}</span><small>{s.shortTitle}</small></button>)}
    </nav>
    <div className="story-theater">
      <article className="story-script case-panel">
        <div className="story-scene-label"><span>{scene.chapter}</span><span>{step + 1} / {storyScenes.length}</span></div>
        <StoryImage key={`image-${scene.id}`} media={storyMedia[scene.id]} />
        <div className="story-prose" key={`text-${scene.id}`}><h3>{scene.title}</h3><p>{scene.text}</p></div>
        <div className="story-controls">
          <div className="story-progress" role="progressbar" aria-label="Scene playback" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(elapsed / sceneDuration(step) * 100)}><span style={{ width: `${elapsed / sceneDuration(step) * 100}%` }} /></div>
          <div className="story-transport">
            <button className="case-button" aria-label="Previous scene" disabled={step === 0} onClick={() => chooseScene(step - 1)}>←</button>
            <button className="story-play case-button" onClick={() => { if (complete) chooseScene(0); setPlaying(p => !p); }}>{playing ? 'Pause' : complete ? 'Replay story' : 'Play story'}</button>
            <button className="case-button" aria-label="Next scene" disabled={step === storyScenes.length - 1} onClick={() => chooseScene(step + 1)}>→</button>
          </div>
          <label className="story-read-aloud"><input type="checkbox" checked={readAloud} disabled={!speechSupported} aria-describedby="story-speech-help" onChange={event => {
            setReadAloud(event.target.checked); setPlaying(false); setSpeechError('');
            elapsedRef.current = 0; setElapsed(0);
          }} /><span>Read aloud</span><small aria-hidden="true">Optional</small></label>
          <p id="story-speech-help" className="case-help">{!speechSupported ? 'Read aloud is unavailable in this browser. Text playback still works.' : readAloud ? 'Automatically chooses an English narration voice. Press Play; each scene waits for the voice to finish.' : 'Enable to hear the scene and graph note with an automatically selected voice.'}</p>
          {speechError && <p className="story-speech-error" role="alert">{speechError}</p>}
          <p className="case-help">{complete ? 'The case is complete. Replay, revisit a scene, or explore an object.' : playing ? 'Playing · explore the graph while the story continues.' : 'Move at your own pace, or press Play to advance automatically.'}</p>
        </div>
        <div className="story-takeaway"><p className="case-eyebrow">READING THE GRAPH</p><p>{scene.takeaway}</p></div>
      </article>
      <div className="story-visual case-panel">
        <div className="story-graph-heading"><div><p className="case-eyebrow">THE CASE SO FAR</p><p><strong>{frame.graph.nodes.length}</strong> {frame.graph.nodes.length === 1 ? 'object' : 'objects'} <span>·</span> <strong>{frame.graph.edges.length}</strong> connections</p></div><span className="story-new-count">+{scene.introduced.length} {scene.introduced.length === 1 ? 'object' : 'objects'}</span></div>
        <StoryGraph step={step} selected={inspected} onSelect={inspect} onReady={setReady} />
        <div className="story-selection" aria-live="polite">{object ? <><span><small>{object.type}</small><strong>{labelOf(object)}</strong></span><button className="case-button" onClick={() => onExplore(object.id)}>Explore object ↗</button></> : <p className="case-help">{ready ? 'Select any revealed node to inspect it. Drag to arrange; scroll to zoom.' : 'The story and object list are available while the graph loads.'}</p>}</div>
      </div>
    </div>
    <div className="story-discoveries case-panel"><div><p className="case-eyebrow">NEW IN THIS SCENE</p><h3>The story gains {scene.introduced.length === 1 ? 'a new object' : `${scene.introduced.length} objects`}.</h3></div><ul>{scene.introduced.map(id => <li key={id}><button aria-pressed={inspected === id} onClick={() => inspect(id)}>{labelOf(hackersById.get(id)!)}<small>{hackersById.get(id)!.type}</small></button></li>)}</ul></div>
    <details className="story-revealed case-panel"><summary>All objects revealed so far ({frame.graph.nodes.length})</summary><ul>{frame.graph.nodes.map(node => <li key={node.id}><button onClick={() => inspect(node.id)}>{node.label}</button></li>)}</ul><p className="case-help">This list also works when the graph cannot render. Relationships appear as connections; context objects keep their references in the explorer.</p></details>
    <p className="sr-only" role="status" aria-live={readAloud ? 'off' : 'polite'}>Scene {step + 1} of {storyScenes.length}: {scene.title}</p>
  </section>;
}
