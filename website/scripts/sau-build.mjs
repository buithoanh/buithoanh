// Bản standalone (npm start) cần thêm file tĩnh và thư mục public bên cạnh server.js.
import fs from "node:fs";
fs.cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
fs.cpSync("public", ".next/standalone/public", { recursive: true });
