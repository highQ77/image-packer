// copy script from stack overflow
// https://stackoverflow.com/questions/56642111/bin-packing-js-implementation-using-box-rotation-for-best-fit

Packer = function (w, h) {
    this.init(w, h);
};

Packer.prototype = {

    init: function (w, h) {
        this._root = { x: 0, y: 0, w: w, h: h }
    },

    intersect: function (block0, block1) {
        //
        // Returns the intersecting block of
        // block0 and block1.
        //
        let ix0 = Math.max(block0.x0, block1.x0);
        let ix1 = Math.min(block0.x1, block1.x1);
        let iy0 = Math.max(block0.y0, block1.y0);
        let iy1 = Math.min(block0.y1, block1.y1);

        if (ix0 <= ix1 && iy0 <= iy1) {
            return { x0: ix0, y0: iy0, x1: ix1, y1: iy1 };
        } else {
            return null;
        }
    },

    chunkContains: function (heapBlock0, heapBlock1) {
        //
        // Determine whether heapBlock0 totally encompasses (ie, contains) heapBlock1.
        //
        return heapBlock0.x0 <= heapBlock1.x0 && heapBlock0.y0 <= heapBlock1.y0 && heapBlock1.x1 <= heapBlock0.x1 && heapBlock1.y1 <= heapBlock0.y1;
    },

    expand: function (heapBlock0, heapBlock1) {
        //
        // Extend heapBlock0 and heapBlock1 if they are
        // adjoining or overlapping.
        //
        if (heapBlock0.x0 <= heapBlock1.x0 && heapBlock1.x1 <= heapBlock0.x1 && heapBlock1.y0 <= heapBlock0.y1) {
            heapBlock1.y0 = Math.min(heapBlock0.y0, heapBlock1.y0);
            heapBlock1.y1 = Math.max(heapBlock0.y1, heapBlock1.y1);
        }

        if (heapBlock0.y0 <= heapBlock1.y0 && heapBlock1.y1 <= heapBlock0.y1 && heapBlock1.x0 <= heapBlock0.x1) {
            heapBlock1.x0 = Math.min(heapBlock0.x0, heapBlock1.x0);
            heapBlock1.x1 = Math.max(heapBlock0.x1, heapBlock1.x1);
        }
    },

    unionMax: function (heapBlock0, heapBlock1) {
        //
        // Given two heap blocks, determine whether...
        //
        if (heapBlock0 && heapBlock1) {
            // ...heapBlock0 and heapBlock1 intersect, and if so...
            let i = this.intersect(heapBlock0, heapBlock1);
            if (i) {
                if (this.chunkContains(heapBlock0, heapBlock1)) {
                    // ...if heapBlock1 is contained by heapBlock0...
                    heapBlock1 = null;
                } else if (this.chunkContains(heapBlock1, heapBlock0)) {
                    // ...or if heapBlock0 is contained by heapBlock1...
                    heapBlock0 = null;
                } else {
                    // ...otherwise, let's expand both heapBlock0 and
                    // heapBlock1 to encompass as much of the intersected
                    // space as possible.  In this instance, both heapBlock0
                    // and heapBlock1 will overlap.
                    this.expand(heapBlock0, heapBlock1);
                    this.expand(heapBlock1, heapBlock0);
                }
            }
        }
    },

    unionAll: function () {
        //
        // Loop through the entire heap, looking to eliminate duplicative
        // heapBlocks, and to extend adjoining or intersecting heapBlocks,
        // despite this introducing overlapping heapBlocks.
        //
        for (let i = 0; i < this.heap.length; i++) {
            for (let j = 0; j < this.heap.length; j++) {
                if (i !== j) {
                    this.unionMax(this.heap[i], this.heap[j]);
                    if (this.heap[i] && this.heap[j]) {
                        if (this.chunkContains(this.heap[j], this.heap[i])) {
                            this.heap[i] = null;
                        } else if (this.chunkContains(this.heap[i], this.heap[j])) {
                            this.heap[j] = null;
                        }
                    }
                }
            }
        }
        // Eliminate the duplicative (ie, nulled) heapBlocks.
        let onlyBlocks = [];
        for (let i = 0; i < this.heap.length; i++) {
            if (this.heap[i]) {
                onlyBlocks.push(this.heap[i]);
            }
        }
        this.heap = onlyBlocks;
    },

    fit: function (blocks) {
        //
        // Loop through all the blocks, looking for a heapBlock
        // that it can fit into.
        //
        this.heap = [{ x0: 0, y0: 0, x1: this._root.w, y1: this._root.h }];
        var n, node, block;
        for (n = 0; n < blocks.length; n++) {
            block = blocks[n];
            block.rotate = false;
            if (this.findInHeap(block)) {
                this.adjustHeap(block);
            } else {
                // If the block didn't fit in its current orientation,
                // rotate its dimensions and look again.
                block.w = block.h + (block.h = block.w, 0);
                block.rotate = true;
                if (this.findInHeap(block)) {
                    this.adjustHeap(block);
                }
            }
        }
    },

    findInHeap: function (block) {
        //
        // Find a heapBlock that can contain the block.
        //
        for (let i = 0; i < this.heap.length; i++) {
            let heapBlock = this.heap[i];
            if (heapBlock && block.w <= heapBlock.x1 - heapBlock.x0 && block.h <= heapBlock.y1 - heapBlock.y0) {
                block.x0 = heapBlock.x0;
                block.y0 = heapBlock.y0;
                block.x1 = heapBlock.x0 + block.w;
                block.y1 = heapBlock.y0 + block.h;
                return true;
            }
        }
        return false;
    },

    adjustHeap: function (block) {
        //
        // Find all heap entries that intersect with block,
        // and adjust the heap by breaking up the heapBlock
        // into the possible 4 blocks that remain after
        // removing the intersecting portion.
        //
        let n = this.heap.length;
        for (let i = 0; i < n; i++) {
            let heapBlock = this.heap[i];
            let overlap = this.intersect(heapBlock, block);
            if (overlap) {

                // Top
                if (overlap.y1 !== heapBlock.y1) {
                    this.heap.push({
                        x0: heapBlock.x0,
                        y0: overlap.y1,
                        x1: heapBlock.x1,
                        y1: heapBlock.y1
                    });
                }

                // Right
                if (overlap.x1 !== heapBlock.x1) {
                    this.heap.push({
                        x0: overlap.x1,
                        y0: heapBlock.y0,
                        x1: heapBlock.x1,
                        y1: heapBlock.y1
                    });
                }

                // Bottom
                if (heapBlock.y0 !== overlap.y0) {
                    this.heap.push({
                        x0: heapBlock.x0,
                        y0: heapBlock.y0,
                        x1: heapBlock.x1,
                        y1: overlap.y0
                    });
                }

                // Left
                if (heapBlock.x0 != overlap.x0) {
                    this.heap.push({
                        x0: heapBlock.x0,
                        y0: heapBlock.y0,
                        x1: overlap.x0,
                        y1: heapBlock.y1
                    });
                }

                this.heap[i] = null;
            }
        }

        this.unionAll();
    }

}