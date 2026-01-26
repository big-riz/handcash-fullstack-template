import { AnimationState } from '../core/AnimationController'

/**
 * SpriteConfig - Complete configuration for an entity sprite
 */
export interface SpriteConfig {
  id: string
  spriteSheet: string
  frameWidth: number
  frameHeight: number
  framesPerRow: number
  scale: number
  shadowRadius: number
  animations: Record<string, Omit<AnimationState, 'name'>>
}

/**
 * SPRITE_CONFIGS - Configuration for all entity sprites
 */
export const SPRITE_CONFIGS: Record<string, SpriteConfig> = {
  player: {
    id: 'player',
    spriteSheet: '/sprites/player/player_sheet.png',
    frameWidth: 64,
    frameHeight: 64,
    framesPerRow: 8,
    scale: 1.5,
    shadowRadius: 0.4,
    animations: {
      idle: { frames: [0], fps: 1, loop: true },
      walk: { frames: [0, 1, 2, 3], fps: 8, loop: true },
      attack: { frames: [0], fps: 1, loop: false, nextState: 'idle' },
      hurt: { frames: [0], fps: 1, loop: false, nextState: 'idle' },
      die: { frames: [0], fps: 1, loop: false }
    }
  },

  drifter: {
    id: 'drifter',
    spriteSheet: '/sprites/enemies/drifter_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.0,
    shadowRadius: 0.3,
    animations: {
      idle: { frames: [0, 1], fps: 6, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 10, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  bruiser: {
    id: 'bruiser',
    spriteSheet: '/sprites/enemies/bruiser_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.2,
    shadowRadius: 0.4,
    animations: {
      idle: { frames: [0, 1], fps: 6, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 10, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  screecher: {
    id: 'screecher',
    spriteSheet: '/sprites/enemies/screecher_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.0,
    shadowRadius: 0.3,
    animations: {
      idle: { frames: [0, 1], fps: 8, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 12, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  zmora: {
    id: 'zmora',
    spriteSheet: '/sprites/enemies/zmora_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.1,
    shadowRadius: 0.3,
    animations: {
      idle: { frames: [0, 1], fps: 6, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 10, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  domovoi: {
    id: 'domovoi',
    spriteSheet: '/sprites/enemies/domovoi_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 0.9,
    shadowRadius: 0.25,
    animations: {
      idle: { frames: [0, 1], fps: 6, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 10, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  kikimora: {
    id: 'kikimora',
    spriteSheet: '/sprites/enemies/kikimora_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.0,
    shadowRadius: 0.3,
    animations: {
      idle: { frames: [0, 1], fps: 6, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 10, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  leshy: {
    id: 'leshy',
    spriteSheet: '/sprites/enemies/leshy_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.3,
    shadowRadius: 0.4,
    animations: {
      idle: { frames: [0, 1], fps: 5, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 8, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  werewolf: {
    id: 'werewolf',
    spriteSheet: '/sprites/enemies/werewolf_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.2,
    shadowRadius: 0.4,
    animations: {
      idle: { frames: [0, 1], fps: 7, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 12, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  forest_wraith: {
    id: 'forest_wraith',
    spriteSheet: '/sprites/enemies/forest_wraith_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.1,
    shadowRadius: 0.35,
    animations: {
      idle: { frames: [0, 1], fps: 6, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 10, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  guardian_golem: {
    id: 'guardian_golem',
    spriteSheet: '/sprites/enemies/guardian_golem_sheet.png',
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.4,
    shadowRadius: 0.5,
    animations: {
      idle: { frames: [0, 1], fps: 4, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 8, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  // New enemy types (using placeholder sprites for now)
  sapling: {
    id: 'sapling',
    spriteSheet: '/sprites/enemies/drifter_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 0.8,
    shadowRadius: 0.25,
    animations: {
      idle: { frames: [0, 1], fps: 6, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 10, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  tox_shroom: {
    id: 'tox_shroom',
    spriteSheet: '/sprites/enemies/drifter_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 0.9,
    shadowRadius: 0.3,
    animations: {
      idle: { frames: [0, 1], fps: 5, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 8, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  stone_golem: {
    id: 'stone_golem',
    spriteSheet: '/sprites/enemies/guardian_golem_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.3,
    shadowRadius: 0.45,
    animations: {
      idle: { frames: [0, 1], fps: 4, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 8, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  spirit_wolf: {
    id: 'spirit_wolf',
    spriteSheet: '/sprites/enemies/werewolf_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.1,
    shadowRadius: 0.35,
    animations: {
      idle: { frames: [0, 1], fps: 7, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 12, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  leshy_shaman: {
    id: 'leshy_shaman',
    spriteSheet: '/sprites/enemies/leshy_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.2,
    shadowRadius: 0.4,
    animations: {
      idle: { frames: [0, 1], fps: 5, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 8, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  ancient_treant: {
    id: 'ancient_treant',
    spriteSheet: '/sprites/enemies/leshy_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.5,
    shadowRadius: 0.5,
    animations: {
      idle: { frames: [0, 1], fps: 3, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 6, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  wasp_swarm: {
    id: 'wasp_swarm',
    spriteSheet: '/sprites/enemies/screecher_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.0,
    shadowRadius: 0.3,
    animations: {
      idle: { frames: [0, 1], fps: 8, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 14, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  golem_destroyer: {
    id: 'golem_destroyer',
    spriteSheet: '/sprites/enemies/guardian_golem_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.6,
    shadowRadius: 0.6,
    animations: {
      idle: { frames: [0, 1], fps: 4, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 7, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  shadow_stalker: {
    id: 'shadow_stalker',
    spriteSheet: '/sprites/enemies/forest_wraith_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.2,
    shadowRadius: 0.35,
    animations: {
      idle: { frames: [0, 1], fps: 6, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 11, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  chernobog: {
    id: 'chernobog',
    spriteSheet: '/sprites/enemies/bruiser_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 2.0,
    shadowRadius: 0.8,
    animations: {
      idle: { frames: [0, 1], fps: 5, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 9, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  },

  vodnik: {
    id: 'vodnik',
    spriteSheet: '/sprites/enemies/zmora_sheet.png', // Placeholder
    frameWidth: 48,
    frameHeight: 48,
    framesPerRow: 4,
    scale: 1.1,
    shadowRadius: 0.35,
    animations: {
      idle: { frames: [0, 1], fps: 6, loop: true },
      walk: { frames: [4, 5, 6, 7], fps: 10, loop: true },
      die: { frames: [8, 9, 10, 11], fps: 10, loop: false }
    }
  }
}
