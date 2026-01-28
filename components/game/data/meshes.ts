
export interface MeshType {
    id: string;
    name: string;
    description: string;
    color: number;
    category: 'nature' | 'props' | 'structure' | 'other';
    defaultScale?: number;
    hasCollision?: boolean;
    isStatic?: boolean;
}

export const MESH_TYPES: MeshType[] = [
    // Nature
    { id: 'rock', name: 'Rock', description: 'Static rock obstacle', color: 0x888888, category: 'nature' },
    { id: 'tree', name: 'Tree', description: 'Forest tree', color: 0x4a7c3e, category: 'nature' },
    { id: 'tree_dead', name: 'Dead Tree', description: 'A withered tree', color: 0x3e2723, category: 'nature' },
    { id: 'shrub', name: 'Shrub', description: 'A small thicket', color: 0x2e7d32, category: 'nature' },
    { id: 'crystal', name: 'Crystal', description: 'Glowing crystal formation', color: 0x00ffff, category: 'nature' },
    
    // Props
    { id: 'crate', name: 'Crate', description: 'Wooden crate', color: 0x8b6f47, category: 'props' },
    { id: 'barrel', name: 'Barrel', description: 'Wooden barrel', color: 0x654321, category: 'props' },
    { id: 'cart', name: 'Cart', description: 'Wooden supply cart', color: 0x5d4037, category: 'props' },
    
    // Structures
    { id: 'wall', name: 'Wall', description: 'Stone wall segment', color: 0x666666, category: 'structure' },
    { id: 'fence', name: 'Fence', description: 'Wooden fence segment', color: 0x795548, category: 'structure' },
    { id: 'pillar', name: 'Pillar', description: 'Stone pillar', color: 0x999999, category: 'structure' },
    { id: 'pillar_broken', name: 'Broken Pillar', description: 'Ancient ruined pillar', color: 0x888888, category: 'structure' },
    { id: 'ruins_brick', name: 'Brick Pile', description: 'Pile of old bricks', color: 0x7b1f1f, category: 'structure' },
    { id: 'statue', name: 'Statue', description: 'Ancient stone statue', color: 0xaaaaaa, category: 'structure' },
    { id: 'well', name: 'Well', description: 'Small stone well', color: 0x555555, category: 'structure' },

    // Spline-friendly segments
    { id: 'fence_wood', name: 'Wood Fence', description: 'Wooden post + rail segment', color: 0x8B6914, category: 'structure' },
    { id: 'fence_iron', name: 'Iron Fence', description: 'Iron post + picket segment', color: 0x444444, category: 'structure' },
    { id: 'wall_stone', name: 'Stone Wall', description: 'Rough stone wall segment', color: 0x777777, category: 'structure' },
    { id: 'wall_brick', name: 'Brick Wall', description: 'Brick wall segment', color: 0x8B3A3A, category: 'structure' },
    { id: 'hedge_row', name: 'Hedge', description: 'Green hedge block', color: 0x2E7D32, category: 'structure' },
    { id: 'log_fence', name: 'Log Fence', description: 'Rustic log fence segment', color: 0x5D4037, category: 'structure' },
];

export const MESH_CATEGORIES = [
    { id: 'nature', name: 'Nature' },
    { id: 'props', name: 'Props' },
    { id: 'structure', name: 'Structures' },
    { id: 'other', name: 'Other' },
];
