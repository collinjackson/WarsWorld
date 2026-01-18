"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleStates = sampleStates;
function sampleStates() {
    const base = {
        width: 10,
        height: 10,
        tiles: Array.from({ length: 100 }, (_, idx) => {
            const x = idx % 10;
            const y = Math.floor(idx / 10);
            if (x === 1 && y === 1)
                return { terrain: "hq", owner: "P1" };
            if (x === 8 && y === 8)
                return { terrain: "hq", owner: "P2" };
            if ((x + y) % 5 === 0)
                return { terrain: "city", owner: null };
            return { terrain: "plain", owner: null };
        }),
        units: [
            { id: 1, owner: "P1", kind: "Infantry", pos: { x: 1, y: 2 } },
            { id: 2, owner: "P1", kind: "Tank", pos: { x: 2, y: 1 } },
            { id: 3, owner: "P2", kind: "Infantry", pos: { x: 8, y: 7 } },
            { id: 4, owner: "P2", kind: "Tank", pos: { x: 7, y: 8 } },
        ],
    };
    const frames = [];
    frames.push(base);
    const f2 = structuredClone(base);
    f2.units[0].pos = { x: 2, y: 2 };
    frames.push(f2);
    const f3 = structuredClone(f2);
    f3.units[3].pos = { x: 6, y: 7 };
    frames.push(f3);
    const f4 = structuredClone(f3);
    f4.units[1].pos = { x: 3, y: 1 };
    frames.push(f4);
    const f5 = structuredClone(f4);
    f5.units[2].pos = { x: 7, y: 6 };
    frames.push(f5);
    return frames;
}
