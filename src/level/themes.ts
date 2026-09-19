import type { TilePalette } from '../art/tiles';

/** The three places the game visits. */
export type ThemeName = 'forest' | 'cave' | 'city';

/**
 * Palettes, one per place.
 *
 * The tiles are the same shapes everywhere -- a girder and a branch are the
 * same one-way platform underneath -- so a level's character comes from its
 * colours and, far more, from its backdrop.
 */
export const THEMES: Record<ThemeName, TilePalette> = {
  forest: {
    grass: 0x6fb257,
    grassDark: 0x4f8c3f,
    dirt: 0x6b4f35,
    dirtDark: 0x54402b,
    rock: 0x8b9199,
    rockDark: 0x666c74,
    rockLight: 0xacb2ba,
    branch: 0x7d5837,
    branchDark: 0x5c3f27,
    leaf: 0x5fa049,
    leafLight: 0x7cc25e,
    trunk: 0x6a4527,
    trunkDark: 0x4a2f1a,
    trunkLight: 0x8a5f39,
    water: 0x3f86b8,
    waterDeep: 0x2f6a95,
    waterFoam: 0xbfe3f5,
    nestStraw: 0xc9a75a,
    nestStrawLight: 0xe6cd8a,
    nestShadow: 0x6b5227,
  },

  // Underground: wet stone, moss instead of grass, and a cold pool.
  cave: {
    grass: 0x5d7a63,
    grassDark: 0x415a48,
    dirt: 0x4a4349,
    dirtDark: 0x352f37,
    rock: 0x6b6472,
    rockDark: 0x474252,
    rockLight: 0x8b84a0,
    branch: 0x6e6577,
    branchDark: 0x4a4352,
    leaf: 0x4f7f7a,
    leafLight: 0x6fa8a0,
    trunk: 0x4f6b4a,          // hanging vines
    trunkDark: 0x36492f,
    trunkLight: 0x6d8f63,
    water: 0x2e5f82,
    waterDeep: 0x1d3f59,
    waterFoam: 0x8fc4dd,
    nestStraw: 0x8a8470,
    nestStrawLight: 0xb0a98f,
    nestShadow: 0x4a4438,
  },

  // Night city: concrete, brick, steel girders, and a canal under lamplight.
  city: {
    grass: 0x7d8a92,          // kerbstone
    grassDark: 0x5a656c,
    dirt: 0x494f55,
    dirtDark: 0x33383d,
    rock: 0x7a5c53,           // brickwork
    rockDark: 0x573f39,
    rockLight: 0x9c776a,
    branch: 0x9aa3ab,         // steel
    branchDark: 0x6d757c,
    leaf: 0xd8a33c,           // lamplight along an edge
    leafLight: 0xf3c76a,
    trunk: 0x6e767d,          // drainpipe
    trunkDark: 0x4d545a,
    trunkLight: 0x939ca3,
    water: 0x2f4d63,
    waterDeep: 0x1e3345,
    waterFoam: 0x9dc0d4,
    nestStraw: 0x9a8f78,
    nestStrawLight: 0xc0b394,
    nestShadow: 0x4e4638,
  },
};
