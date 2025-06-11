const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

// Read the SQL file
const sqlFile = fs.readFileSync(
  path.join(__dirname, "scripts", "init-database.sql"),
  "utf8"
);

// Create database connection
const db = new sqlite3.Database("imagineai.db");

// Split SQL commands (in case there are multiple statements)
const sqlCommands = sqlFile.split(";").filter((cmd) => cmd.trim().length > 0);

console.log("Setting up database...");

// Execute each SQL command
db.serialize(() => {
  sqlCommands.forEach((sql, index) => {
    if (sql.trim()) {
      db.run(sql.trim(), (err) => {
        if (err) {
          console.error(
            `Error executing SQL command ${index + 1}:`,
            err.message
          );
        } else {
          console.log(`✅ SQL command ${index + 1} executed successfully`);
        }
      });
    }
  });
});

db.close((err) => {
  if (err) {
    console.error("Error closing database:", err.message);
  } else {
    console.log("✅ Database setup completed successfully!");
    console.log("You can now run: npm start");
  }
});
