import OpenAI from "openai";
const IMAGE_FOLDER = process.env.NODE_ENV || "images";
import fs from "fs/promises";
import path from "path";

const generateImage = async function () {
  const openai = new OpenAI();
  const response = await openai.images.generate({
    model: "dall-e-2",
    prompt: "a mechanical keyboard with vimal's logo",
    n: 1,
    size: "256x256",
    response_format: "b64_json",
  });

  const fileContent = response.data[0].b64_json;

  await saveImageToDisk(fileContent);
};

const saveImageToDisk = async function (fileContent: any) {
  const filePath = path.join(__dirname, `../../${IMAGE_FOLDER}/dalle.jpg`);
  await fs.writeFile(filePath, fileContent, "base64");
};

generateImage();
