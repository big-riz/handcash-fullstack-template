// AABB representation
interface Boundary {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Data structure for quadtree points
export interface QuadtreePoint {
    x: number;
    y: number;
    data: any; // Can hold a reference to the game entity
}

export class Quadtree {
    private boundary: Boundary;
    private capacity: number;
    private points: QuadtreePoint[] = [];
    private divided: boolean = false;
    private depth: number;

    private static readonly MAX_DEPTH = 8;

    private northeast?: Quadtree;
    private northwest?: Quadtree;
    private southeast?: Quadtree;
    private southwest?: Quadtree;

    constructor(boundary: Boundary, capacity: number, depth: number = 0) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.depth = depth;
    }

    insert(point: QuadtreePoint): boolean {
        if (!this.contains(point)) {
            return false;
        }

        if (this.points.length < this.capacity || this.depth >= Quadtree.MAX_DEPTH) {
            this.points.push(point);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        return (
            this.northeast!.insert(point) ||
            this.northwest!.insert(point) ||
            this.southeast!.insert(point) ||
            this.southwest!.insert(point)
        );
    }

    private subdivide() {
        if (this.depth >= Quadtree.MAX_DEPTH) {
            return;
        }

        const { x, y, width, height } = this.boundary;
        const hw = width / 2;
        const hh = height / 2;
        const nextDepth = this.depth + 1;

        const ne = { x: x + hw, y: y - hh, width: hw, height: hh };
        this.northeast = new Quadtree(ne, this.capacity, nextDepth);

        const nw = { x: x - hw, y: y - hh, width: hw, height: hh };
        this.northwest = new Quadtree(nw, this.capacity, nextDepth);

        const se = { x: x + hw, y: y + hh, width: hw, height: hh };
        this.southeast = new Quadtree(se, this.capacity, nextDepth);

        const sw = { x: x - hw, y: y + hh, width: hw, height: hh };
        this.southwest = new Quadtree(sw, this.capacity, nextDepth);

        this.divided = true;

        // Move existing points to the new children
        for (const p of this.points) {
            (this.northeast!.insert(p) || this.northwest!.insert(p) || this.southeast!.insert(p) || this.southwest!.insert(p));
        }
        this.points = [];
    }

    query(range: Boundary, found: QuadtreePoint[] = []): QuadtreePoint[] {
        if (!this.intersects(range)) {
            return found;
        }

        for (const p of this.points) {
            if (this.rangeContains(range, p)) {
                found.push(p);
            }
        }

        if (this.divided) {
            this.northwest!.query(range, found);
            this.northeast!.query(range, found);
            this.southwest!.query(range, found);
            this.southeast!.query(range, found);
        }

        return found;
    }
    
    // Check if a point is within this quadtree's boundary
    contains(point: QuadtreePoint): boolean {
        return (
            point.x >= this.boundary.x - this.boundary.width &&
            point.x <= this.boundary.x + this.boundary.width &&
            point.y >= this.boundary.y - this.boundary.height &&
            point.y <= this.boundary.y + this.boundary.height
        );
    }

    // Check if a range intersects with this quadtree's boundary
    intersects(range: Boundary): boolean {
        return !(
            range.x - range.width > this.boundary.x + this.boundary.width ||
            range.x + range.width < this.boundary.x - this.boundary.width ||
            range.y - range.height > this.boundary.y + this.boundary.height ||
            range.y + range.height < this.boundary.y - this.boundary.height
        );
    }

    // Check if a range contains a point
    rangeContains(range: Boundary, point: QuadtreePoint): boolean {
        return (
            point.x >= range.x - range.width &&
            point.x <= range.x + range.width &&
            point.y >= range.y - range.height &&
            point.y <= range.y + range.height
        );
    }

    clear() {
        this.points = [];
        this.divided = false;
        this.northeast = undefined;
        this.northwest = undefined;
        this.southeast = undefined;
        this.southwest = undefined;
    }
}
