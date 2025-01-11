import { getEmbeddingsForObject, loadJson } from "./index";
import * as readline from "readline";
import chalk from "chalk";
const questionPrefix = "Q >> ";
const answerPrefix = "A >> ";
let inputCount = 0;
const maxInputs = 5;

type Similarity = {
  input: string;
  similarity: number;
};

const similarities: Similarity[] = [];

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((acc, _, i) => acc + a[i] * b[i], 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProd = dotProduct(a, b);
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  return dotProd / (normA * normB);
}

function getMostSimilarItem(input: Similarity[]) {
  return input.reduce((acc, curr) => (acc.similarity > curr.similarity ? acc : curr));
}

async function main(input: string) {
  console.log("--- << ", input);
  const embeddingDb = await loadJson("embeddings.json");
  const newObjectEmbedding = await getEmbeddingsForObject(input);

  for (let i = 0; i < embeddingDb.data.embeddings.length; i++) {
    const embedding: any = embeddingDb.data.embeddings[i];
    const similarity = cosineSimilarity(embedding.embedding, newObjectEmbedding.data[0].embedding);
    similarities.push({
      input: embedding.input,
      similarity,
    });
  }

  const mostSimilar = getMostSimilarItem(similarities);
  console.log(`${answerPrefix}Most similar item:`, mostSimilar.input);
  inputCount++;

  if (inputCount >= maxInputs) {
    console.clear();
    console.log(chalk.green("Previous chat stored and archived...."));
    inputCount = 0;
  }

  askQuestion();
}

function askQuestion() {
  rl.question(`${questionPrefix}Please enter your input: `, async (answer) => {
    await main(answer);
  });
}

// Interface to take input from the terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

askQuestion();
