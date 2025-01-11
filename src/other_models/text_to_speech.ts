import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI();
const speechFile = path.resolve("./speech.mp3"); // File to save the file.

const genMp3FromText = async (text: string) => {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
};

genMp3FromText("And, aah... I love the Neil Gaiman's short story on the good days combined with the bad days.");
