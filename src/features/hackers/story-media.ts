export interface StoryMedia {
  src: string;
  alt: string;
  caption: string;
  source: string;
}

// Individual gallery entries were visually checked. These remain externally hosted
// film stills, with their source linked in the UI; they are not MIT dataset assets.
const still = (number: string, alt: string, caption: string): StoryMedia => ({
  src: `https://www.cinematicfreeze.com/wp-content/uploads/gallery/hackers-1995/Hackers-1995-stills-${number}.jpg`,
  alt, caption, source: 'https://www.cinematicfreeze.com/hackers-1995-stills/',
});

export const storyMedia: Record<string, StoryMedia> = {
  'zero-cool': still('01', 'Dade Murphy’s face overlaid with the New York skyline.', 'Dade Murphy · Zero Cool / Crash Override'),
  'crash-override': still('03', 'A computer screen displays a taunt during the hackers’ rivalry.', 'A rivalry begins on screen.'),
  'the-crew': still('22', 'Dade and Kate face each other with the rest of the crew gathered around them.', 'The faces behind The Elite.'),
  'the-garbage-file': still('46', 'The Gibson’s files appear as a glowing city of blue towers and purple paths.', 'Inside the Gibson’s “City of Text.”'),
  'the-worm': still('10', 'The Plague enters a room lined with illuminated data towers.', 'The security chief inside the system he exploits.'),
  'the-frame-up': still('17', 'Richard Gill stands beside projected images of the teenage suspects.', 'The crew becomes the target of the investigation.'),
  'hack-the-planet': still('43', 'The hackers work from public payphones with their computers.', 'The counterattack moves to the payphones.'),
  'the-evidence': still('53', 'Large video screens above a New York street broadcast the unfolding case.', 'The evidence reaches a public audience.'),
  'the-aftermath': still('54', 'Dade and Kate are together in a swimming pool at the end of the film.', 'The case closes. Dade and Kate’s story continues.'),
};
