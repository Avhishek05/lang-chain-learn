// simple one msg chat no refernce to previous messages
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";

// Connect to your local Ollama model
const llm = new ChatOllama({
    model: "qwen2.5:3b",
    temperature: 0,
  });

const rl = readline.createInterface({ input, output });

const prompt = ChatPromptTemplate.fromMessages([
    ["human", "{content}"],
  ]);

  // Create the chain
const chain = prompt.pipe(llm);



while (true) {
  const content = await rl.question(">> ");
  
// Execute the chain
const result = await chain.invoke({
    content: contentx
  });
}
