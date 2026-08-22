import "dotenv/config";

import connectDatabase from "../src/config/database.js";
import app from "../src/app.js";

await connectDatabase();

export default app;
