import { appDataDir } from "@tauri-apps/api/path";
import { save } from "@tauri-apps/plugin-dialog";
import { copyFile } from "@tauri-apps/plugin-fs";

export async function backupDatabase(): Promise<void> {
  const dataDir = await appDataDir();
  const dbPath = `${dataDir}/journal.db`;

  const filePath = await save({
    defaultPath: "journal-backup.db",
    filters: [{ name: "SQLite Database", extensions: ["db"] }],
  });
  if (!filePath) return;

  await copyFile(dbPath, filePath);
}
