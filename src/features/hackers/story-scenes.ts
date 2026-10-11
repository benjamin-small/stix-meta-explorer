import { bundleToGraph, hackersObjects } from '../../data/hackers';
import { toWireGraph } from './graph-model';

// Scenes follow the plot in the bundle's report, rather than its illustrative timestamps.
// Named lookups make the editorial sequence readable; tests enforce exact coverage.
const named = (name: string) => {
  const object = hackersObjects.find(o => o.name === name || o.value === name);
  if (!object) throw new Error(`Unknown story object: ${name}`);
  return object.id;
};
const ofType = (type: string) => hackersObjects.filter(o => o.type === type).map(o => o.id);

export const storyScenes = [
  {
    id: 'zero-cool', chapter: 'Prologue · 1988', shortTitle: 'Zero Cool', title: 'A legend goes quiet.',
    text: 'At eleven, Dade Murphy crashes 1,507 computer systems under the handle Zero Cool. He is caught and barred from using a computer until his eighteenth birthday. The name becomes an underground legend while the boy behind it disappears from view.',
    takeaway: 'One person begins the story. His aliases will connect the past to what happens next.',
    introduced: [named('Zero Cool')],
  },
  {
    id: 'crash-override', chapter: 'Act I · Back online', shortTitle: 'Back online', title: 'A new city. A new handle.',
    text: 'Seven years later, Dade moves to New York City and returns online as Crash Override. He talks a television-station guard into giving him a modem number, then takes over the broadcast. Another hacker throws him out: Acid Burn. The rivalry has begun.',
    takeaway: 'People connect to a place, communications infrastructure, and a technique. The modem is equipment; a STIX Tool represents software. Crash Override and Zero Cool are the same person.',
    introduced: ['New York City', 'Acid Burn', 'Dial-up modem', 'Phishing for Information'].map(named),
  },
  {
    id: 'the-crew', chapter: 'Act I · The crew', shortTitle: 'The crew', title: 'Nobody hacks alone.',
    text: 'Dade meets Kate Libby—Acid Burn—at school and finds his way into a circle of hackers: Cereal Killer, Lord Nikon, Phantom Phreak, and Joey Pardella. Across their encounters, a loose crew takes shape. Joey is the youngest, eager to prove he belongs.',
    takeaway: 'The dataset calls their coordinated intrusion activity The Elite. An intrusion set groups behavior and resources; attribution identifies the people responsible for that activity.',
    introduced: ['The Elite', 'Cereal Killer', 'Lord Nikon', 'Phantom Phreak', 'Joey Pardella'].map(named),
  },
  {
    id: 'the-garbage-file', chapter: 'Act II · The intrusion', shortTitle: 'The intrusion', title: 'A trophy with a secret.',
    text: 'Joey breaks into the Gibson, Ellingson Mineral Company’s supercomputer. Weak account passwords leave the system exposed. He copies part of a file called garbage as a trophy. It looks unremarkable, but those bytes will become the evidence everyone is chasing.',
    takeaway: 'A synthetic observation connects the target address and an illustrative source file. Its payload represents the file on the Gibson; separate partial and complete downloaded copies are not modeled. The C2 technique is an approximation that assumes the dial-up session also carries commands.',
    introduced: [...['Gibson', 'Ellingson Mineral Company', 'Gibson weak account passwords', 'Password Guessing', 'Exfiltration Over C2 Channel', 'garbage', '192.0.2.15'].map(named), ...ofType('artifact'), 'observed-data--2d7d303d-769d-487d-8ff5-13e4e0462cd9'],
  },
  {
    id: 'the-worm', chapter: 'Act III · The theft', shortTitle: 'The worm', title: 'The garbage is not garbage.',
    text: 'The file exposes a salami-slicing worm planted by Ellingson’s security chief, The Plague. It quietly diverts fractions of transactions into an account he and Margo Wallace control. The file’s contents reveal the scheme he is desperate to conceal.',
    takeaway: 'The malware connects its author, target, and technique. For this teaching example, a SHA-256 indicator matches our synthetic file payload. That hash is not evidence shown in the film.',
    introduced: ['The Plague', 'Salami-slicing worm', 'Stored Data Manipulation', 'Garbage file SHA-256'].map(named),
  },
  {
    id: 'the-frame-up', chapter: 'Act III · The cover story', shortTitle: 'The frame-up', title: 'Blame the teenagers.',
    text: 'The Plague unleashes Da Vinci, threatening to capsize Ellingson’s tanker fleet, and blames the crew. Secret Service agent Richard Gill pursues them. As the arrests begin, the crew realizes the virus is a smokescreen for the worm. The full garbage file is still on the Gibson.',
    takeaway: 'A second malware object serves a different purpose: extortion and a frame-up. The domain and its observation are synthetic examples added to teach observable references.',
    introduced: [...["The Plague's frame-up", 'Da Vinci', 'Richard Gill', 'ellingson-mineral.example'].map(named), 'observed-data--351e35e5-5273-49ed-b2d5-16a4e951f29b'],
  },
  {
    id: 'hack-the-planet', chapter: 'Act IV · The counterattack', shortTitle: 'Hack the Planet', title: 'One network against the Gibson.',
    text: 'The crew calls on hackers around the world to flood the Gibson. From payphones in Grand Central Terminal, Dade locates the garbage file but is disconnected. He directs Joey to it, and Joey completes the download. Kate calls for the crew to shut down. The proof of The Plague’s scheme finally leaves the system.',
    takeaway: 'A campaign connects the activity, target, and extraction technique. The invented URL and synthetic observation demonstrate a retrieval location; the film does not establish an HTTP transfer.',
    introduced: [...['Hack the Planet', 'http://ellingson-mineral.example/gibson/garbage', 'Garbage file location on the Gibson'].map(named), 'observed-data--0d9e70c2-76d1-4ba2-b615-68b0d6aa87f8'],
  },
  {
    id: 'the-evidence', chapter: 'Act V · The exposure', shortTitle: 'The evidence', title: 'The evidence changes the story.',
    text: 'Gill’s agents arrest Dade and Kate, but the recovered evidence becomes public. Cereal Killer’s broadcast exposes the worm, its connection to Belford and Margo, and the account receiving the money. The Plague is caught trying to leave the country, Margo is taken into custody, and the charges against the teenagers are dropped.',
    takeaway: 'These synthetic sightings demonstrate indicator matches linked to observations and an observing identity. They are teaching examples, not scenes of Gill confirming a hash or URL.',
    introduced: ofType('sighting'),
  },
  {
    id: 'the-aftermath', chapter: 'Epilogue · The case file', shortTitle: 'Aftermath', title: 'From a story to a case.',
    text: 'Ellingson is left with the cleanup: remove the worm, reconcile the accounts, and replace the Gibson’s common passwords. The case file gathers the evidence and the conclusion that the crew was framed. What began with one teenager is now a connected account of people, systems, actions, and proof.',
    takeaway: 'These courses of action are recommended remedies in the teaching dataset. Reports, notes, and groupings provide context rather than new structural links.',
    introduced: [...ofType('course-of-action'), ...ofType('grouping'), ...ofType('note'), ...ofType('opinion'), ...ofType('report')],
  },
];

const structural = bundleToGraph(hackersObjects);
export const storyFrames = storyScenes.map((scene, index) => {
  const revealed = new Set(storyScenes.slice(0, index + 1).flatMap(s => s.introduced));
  const prior = new Set(storyScenes.slice(0, index).flatMap(s => s.introduced));
  const edges = structural.edges.filter(e => revealed.has(e.source) && revealed.has(e.target));
  const newEdges = edges.filter(e => !prior.has(e.source) || !prior.has(e.target));
  return {
    graph: toWireGraph(structural.nodes.filter(n => revealed.has(n.id)), edges),
    newEdges,
    activeIds: [...new Set([...scene.introduced, ...newEdges.flatMap(e => [e.source, e.target])])],
  };
});

export function readStoryScene() {
  const id = new URLSearchParams(window.location.search).get('scene');
  return Math.max(0, storyScenes.findIndex(scene => scene.id === id));
}
