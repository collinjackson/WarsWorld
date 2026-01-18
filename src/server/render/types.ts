export type Player = "P1" | "P2";
export type UnitKind = "Infantry" | "Tank";

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  terrain: "plain" | "city" | "hq";
  owner: Player | null;
}

export interface Unit {
  id: number;
  owner: Player;
  kind: UnitKind;
  pos: Position;
}

export interface RenderState {
  width: number;
  height: number;
  tiles: Tile[];
  units: Unit[];
}
