import pool from "../../config/config.js";
import format from "pg-format";

const Linktree = {};

Linktree.getAll = async () => {
  return await pool.query(`SELECT * FROM shortlinks`);
};

Linktree.getBy = async (field, value) => {
  const sql = format(`SELECT * FROM linktrees WHERE %I = $1`, field);
  return await pool.query(sql, [value]);
};

Linktree.insert = async (id, title, url, email, style) => {
  return await pool.query(
    `INSERT INTO linktrees(id_linktree, linktree_title, linktree_url, time_linktree_created, email, style, time_linktree_last_updated) VALUES ($1, $2, $3, now()::timestamp, $4, $5, now()::timestamp)`,
    [id, title, url, email, style]
  );
};

Linktree.patch = async (title, bio, style, id) => {
  return await pool.query(
    `UPDATE linktrees SET linktree_title = $1, bio = $2, style = $3, time_linktree_last_updated = now()::timestamp WHERE id_linktree = $4`,
    [title, bio, style, id]
  );
};

Linktree.update = async (field, value, fieldCriteria, valueCriteria) => {
  const sql = format(
    "UPDATE linktrees SET %I = $1 WHERE %I = $2",
    field,
    fieldCriteria
  );
  return await pool.query(sql, [value, valueCriteria]);
};

Linktree.delete = async (field, value) => {
  const sql = format(`DELETE FROM linktrees WHERE %I = $1`, field);
  return await pool.query(sql, [value]);
};

Linktree.exists = async (field, value) => {
  const sql = format(
    `SELECT EXISTS(SELECT 1 FROM linktrees WHERE %I = $1)`,
    field
  );
  return await pool.query(sql, [value]);
};

Linktree.getHistory = async (email) => {
  return await pool.query(
    `SELECT id_linktree, linktree_url, time_linktree_last_updated FROM linktrees WHERE email = $1 ORDER BY time_linktree_created DESC`,
    [email]
  );
};

export default Linktree;
