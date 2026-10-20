import { DatabaseSync } from "node:sqlite";
import type { NodeSummary, Save, TurnNode, World } from "../shared/types.ts";

// ponytail: whole records stored as JSON; add columns when a query needs to filter inside them.
export class Store {
  #db: DatabaseSync;

  constructor(path: string) {
    this.#db = new DatabaseSync(path);
    this.#db.exec(`
      pragma journal_mode = wal;
      create table if not exists worlds (id text primary key, data text not null);
      create table if not exists saves (id text primary key, world_id text not null, data text not null);
      create table if not exists nodes (
        id text primary key, world_id text not null, parent_id text, data text not null);
      create index if not exists saves_world on saves (world_id);
      create index if not exists nodes_world on nodes (world_id);
    `);
  }

  #all<T>(sql: string, ...params: string[]): T[] {
    return this.#db
      .prepare(sql)
      .all(...params)
      .map((row) => JSON.parse((row as { data: string }).data) as T);
  }

  #one<T>(sql: string, id: string): T | undefined {
    const row = this.#db.prepare(sql).get(id) as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as T) : undefined;
  }

  worlds = () => this.#all<World>("select data from worlds");
  world = (id: string) => this.#one<World>("select data from worlds where id = ?", id);
  putWorld(world: World) {
    this.#db
      .prepare("insert or replace into worlds (id, data) values (?, ?)")
      .run(world.id, JSON.stringify(world));
  }
  deleteWorld(id: string) {
    for (const table of ["nodes", "saves"])
      this.#db.prepare(`delete from ${table} where world_id = ?`).run(id);
    this.#db.prepare("delete from worlds where id = ?").run(id);
  }

  saves = (worldId: string) => this.#all<Save>("select data from saves where world_id = ?", worldId);
  save = (id: string) => this.#one<Save>("select data from saves where id = ?", id);
  putSave(save: Save) {
    this.#db
      .prepare("insert or replace into saves (id, world_id, data) values (?, ?, ?)")
      .run(save.id, save.worldId, JSON.stringify(save));
  }
  deleteSave(id: string) {
    this.#db.prepare("delete from saves where id = ?").run(id);
  }

  node = (id: string) => this.#one<TurnNode>("select data from nodes where id = ?", id);
  putNode(node: TurnNode) {
    this.#db
      .prepare("insert or replace into nodes (id, world_id, parent_id, data) values (?, ?, ?, ?)")
      .run(node.id, node.worldId, node.parentId, JSON.stringify(node));
  }

  /**
   * The turns from the opening to this node, read in one query. Every turn keeps a whole world state, so only the
   * last one's is read up front: an earlier turn's state is read when it is used, and is left out when the path is
   * sent as JSON. Reading every state made a 155-turn path take 120 ms, and it grows with every turn.
   */
  path(headId: string): TurnNode[] {
    const rows = this.#db
      .prepare(
        `with recursive up(id, parent_id, data, kept, chronicled, depth) as (
           select id, parent_id, data, 1, 0, 0 from nodes where id = ?
           union all
           select n.id, n.parent_id, json_remove(n.data, '$.state', '$.memory', '$.timeline'),
             json_type(n.data, '$.state') is not null, json_type(n.data, '$.timeline') is not null, up.depth + 1
             from nodes n join up on n.id = up.parent_id)
         select data, kept, chronicled from up order by depth desc`,
      )
      .all(headId) as { data: string; kept: number; chronicled: number }[];
    return rows.map((row) => {
      const node = JSON.parse(row.data) as TurnNode;
      // Read on first use, and left out of JSON. A turn whose state was let go has none.
      let whole: TurnNode | undefined;
      const later = (key: "state" | "memory" | "timeline") =>
        Object.defineProperty(node, key, { get: () => (whole ??= this.node(node.id)!)[key], enumerable: false });
      if (row.kept && row !== rows.at(-1)) later("state");
      if (row.chronicled) for (const key of ["memory", "timeline"] as const) later(key);
      return node;
    });
  }

  /**
   * Lets these turns go of their world state: their story and changes stay, but they can no longer be resumed.
   * Keeping a whole state for every turn made a save grow by tens of kilobytes a turn.
   */
  forgetStates(ids: string[]) {
    const forget = this.#db.prepare(
      "update nodes set data = json_remove(data, '$.state') where id = ? and json_type(data, '$.state') is not null",
    );
    for (const id of ids) forget.run(id);
  }

  /** How many turns lead from the opening to this one, without reading them. */
  depth(id: string): number {
    const row = this.#db
      .prepare(
        `with recursive up(id, parent_id, d) as (
           select id, parent_id, 0 from nodes where id = ?
           union all
           select n.id, n.parent_id, up.d + 1 from nodes n join up on n.id = up.parent_id)
         select max(d) as d from up`,
      )
      .get(id) as { d: number | null } | undefined;
    return row?.d ?? 0;
  }

  tree(worldId: string): NodeSummary[] {
    return (
      this.#db
        .prepare(
          `select id, parent_id as parentId, data ->> '$.actor' as actor, data ->> '$.input' as input,
             data ->> '$.createdAt' as createdAt, json_type(data, '$.state') is not null as resumable
           from nodes where world_id = ?`,
        )
        .all(worldId) as unknown as (Omit<NodeSummary, "resumable"> & { resumable: number })[]
    ).map((n) => ({ ...n, resumable: n.resumable === 1 }));
  }
}
