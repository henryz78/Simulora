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

  /** The turns from the opening to this node. */
  path(headId: string): TurnNode[] {
    const path: TurnNode[] = [];
    for (let node = this.node(headId); node; node = node.parentId ? this.node(node.parentId) : undefined)
      path.push(node);
    return path.reverse();
  }

  tree(worldId: string): NodeSummary[] {
    return this.#db
      .prepare(
        `select id, parent_id as parentId, data ->> '$.actor' as actor, data ->> '$.input' as input,
           data ->> '$.createdAt' as createdAt from nodes where world_id = ?`,
      )
      .all(worldId) as unknown as NodeSummary[];
  }
}
