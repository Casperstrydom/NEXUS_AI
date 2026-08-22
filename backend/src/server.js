import "dotenv/config";

import connectDatabase from "./config/database.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

await connectDatabase();

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║          NEXUSAI BACKEND             ║
╠══════════════════════════════════════╣
║ Server: http://localhost:${PORT}     ║
║ Status: ONLINE                       ║
╚══════════════════════════════════════╝
  `);
});
