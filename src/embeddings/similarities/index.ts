import { JSONFilePreset } from "lowdb/node";
import { join } from "path";
const basePath = join(__dirname, "../../../");
import OpenAI from "openai";
const openai = new OpenAI();

const defaultData = { my_schedule: [""] };
export const getEmbeddingsForObject = async (schedule: string | string[]) => {
  const embeddings = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: schedule,
    encoding_format: "float",
  });

  return embeddings;
};

export const loadSchedule = async () => {
  const scheduleDbPath = join(basePath, "schedule.json");
  const db = await JSONFilePreset(scheduleDbPath, defaultData);
  return db;
};

export const loadJson = async (path: string) => {
  const dbPath = join(basePath, path);
  const db = await JSONFilePreset(dbPath, { embeddings: [] });
  return db;
};

const saveEmbeddings = async (db: any, embeddings: any) => {
  const embeddingsDbPath = join(basePath, "embeddings.json");
  const defaultEmbeddingsDb: any = { embeddings: [] };
  const embeddingsDb: any = await JSONFilePreset(embeddingsDbPath, defaultEmbeddingsDb);
  db.data.my_schedule.forEach((schedule: string, index: number) => {
    embeddingsDb.data.embeddings.push({ input: schedule, embedding: embeddings.data[index].embedding });
  });
  await embeddingsDb.write();
};

if (module === require.main) {
  loadSchedule().then(async (db) => {
    console.log("db", db);
    const response = await getEmbeddingsForObject(db.data.my_schedule);
    await saveEmbeddings(db, response);
    console.log("Embeddings saved successfully");
  });
}
