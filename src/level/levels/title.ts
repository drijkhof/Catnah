import type { LevelDefinition } from '../Level';

/**
 * The title screen's level: a cut from level 1, columns 36 to 89 and rows 7
 * down, with a crow added.
 *
 * It is a real level, played by `GameScene` in title mode, so the hedgehog and
 * the piranhas are the real ones and behave as they do in the forest. Nobody
 * plays it: the cat stands on the lowest branch of the tree that holds the
 * hearts, and the camera is fixed so that exactly two rows of ground show.
 *
 * Wider and taller than any screen needs. A phone shows about 35 tiles across,
 * the widest laptop window about 53, and each is centred on the cat, so the
 * extra is what a wider screen gets to see. The cut starts and ends clear of
 * any branch, because `branchesNeedTrunks` would refuse one with no tree.
 *
 * It is not in `LEVELS`: the game never walks into it, and skipping levels
 * never lands on it.
 *
 * The crow only flies by and back (`crowBehaviour`), it does not attack.
 */
const TITLE_ROWS: string[] = [
  '......................T...............................',
  '......................T...............................',
  '..................ooo.T...............................',
  '..................====T...............................',
  '......................T...............................',
  '......................T...............................',
  '......................Tooo............................',
  '......................T=====..........................',
  '..............c.......T...............................',
  '......................T...............................',
  '..................ooo.T..................oo...........',
  '..................====T.......QQQQ.......RR...........',
  '......................T.......QQQQ.......RR...........',
  '......................T........GGGQ......RR..........T',
  '......................Tooo.P..RRRRQ......RR..........T',
  '........T.............T=====..RRRR.......RR..........T',
  '........Tooo..........T.......RRRR.......RR......ooo.T',
  '........T====.........T......GGGQQQ......RR......====T',
  '....ooo.T.........ooo.T......QQQQQQ......RR..........T',
  '....====T........oo===T.......RRRo.......RR..........T',
  '..ooo...T.......RRRRRRT.......RRQQQ......RR..........T',
  '.RRRRRR.T.......RRRRRRT......GGGQQQ......RR..........T',
  '.RRRRRR.T.......RRRRRRT....h.GGGQQQ......RR..........T',
  '##########wwwfw#############################wwfww#####',
  '##########wfwww#############################wwwww#####',
  '######################################################',
  '######################################################',
];

export const TITLE: LevelDefinition = {
  name: 'Title',
  theme: 'forest',
  groundRow: 23,
  branchesNeedTrunks: true,
  climbableColumns: false,
  crowBehaviour: 'flyby',
  rows: TITLE_ROWS,
};
