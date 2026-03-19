import dotenv from "dotenv";
import { createServer } from "./infrastructure/server/createServer";

dotenv.config();

const app = createServer();
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Backend is running on port ${port}`);
});
