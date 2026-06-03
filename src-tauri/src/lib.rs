use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_entries_table",
        sql: r#"
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL DEFAULT '',
                body TEXT NOT NULL DEFAULT '',
                mood TEXT NOT NULL DEFAULT '',
                what_happened TEXT NOT NULL DEFAULT '',
                feelings TEXT NOT NULL DEFAULT '',
                learning TEXT NOT NULL DEFAULT '',
                goal_relation TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        "#,
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:journal.db", migrations)
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
