import zeroCoolStill from '../../assets/hackers-1995/Hackers-1995-stills-01.jpg';
import crashOverrideStill from '../../assets/hackers-1995/Hackers-1995-stills-03.jpg';
import crewStill from '../../assets/hackers-1995/Hackers-1995-stills-22.jpg';
import garbageFileStill from '../../assets/hackers-1995/Hackers-1995-stills-46.jpg';
import wormStill from '../../assets/hackers-1995/Hackers-1995-stills-10.jpg';
import frameUpStill from '../../assets/hackers-1995/Hackers-1995-stills-17.jpg';
import hackThePlanetStill from '../../assets/hackers-1995/Hackers-1995-stills-43.jpg';
import evidenceStill from '../../assets/hackers-1995/Hackers-1995-stills-53.jpg';
import aftermathStill from '../../assets/hackers-1995/Hackers-1995-stills-54.jpg';

export interface StoryMedia {
  src: string;
  alt: string;
  caption: string;
  source: string;
}

// Vite bundles these local stills with the app. Their gallery source remains linked
// in the UI; see src/assets/hackers-1995/README.md for provenance and rights information.
const still = (src: string, alt: string, caption: string): StoryMedia => ({
  src,
  alt, caption, source: 'https://www.cinematicfreeze.com/hackers-1995-stills/',
});

export const storyMedia: Record<string, StoryMedia> = {
  'zero-cool': still(zeroCoolStill, 'Dade Murphy’s face overlaid with the New York skyline.', 'Dade Murphy · Zero Cool / Crash Override'),
  'crash-override': still(crashOverrideStill, 'A computer screen displays a taunt during the hackers’ rivalry.', 'A rivalry begins on screen.'),
  'the-crew': still(crewStill, 'Dade and Kate face each other with the rest of the crew gathered around them.', 'The faces behind the crew.'),
  'the-garbage-file': still(garbageFileStill, 'The Gibson’s files appear as a glowing city of blue towers and purple paths.', 'Inside the Gibson’s “City of Text.”'),
  'the-worm': still(wormStill, 'The Plague enters a room lined with illuminated data towers.', 'The security chief inside the system he exploits.'),
  'the-frame-up': still(frameUpStill, 'Richard Gill stands beside projected images of the teenage suspects.', 'The crew becomes the target of the investigation.'),
  'hack-the-planet': still(hackThePlanetStill, 'The hackers work from public payphones with their computers.', 'The counterattack moves to the payphones.'),
  'the-evidence': still(evidenceStill, 'Large video screens above a New York street broadcast the unfolding case.', 'The evidence reaches a public audience.'),
  'the-aftermath': still(aftermathStill, 'Dade and Kate are together in a swimming pool at the end of the film.', 'The case closes. Dade and Kate’s story continues.'),
};
