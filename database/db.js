import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("bagapp.db");

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      birthDate TEXT,
      money REAL,
      parentPhone TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      personId INTEGER,
      itemId INTEGER,
      quantity INTEGER
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      personId INTEGER,
      description TEXT,
      amount REAL
    );
  `);
};
export const deletePersonCascade = (personId) => {
  db.runSync("DELETE FROM expenses WHERE personId=?", [personId]);
  db.runSync("DELETE FROM inventory WHERE personId=?", [personId]);
  db.runSync("DELETE FROM people WHERE id=?", [personId]);
};