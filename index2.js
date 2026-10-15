// chat with using context of last messsages too
import { ChatOllama } from "@langchain/ollama";
import {
    StateGraph,
    MessagesAnnotation,
    MemorySaver,
} from "@langchain/langgraph";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const llm = new ChatOllama({
    model: "qwen2.5:3b",
    temperature: 0,
});
const rl = readline.createInterface({ input, output });

// Define a graph that sends conversation messages to Ollama
const graph = new StateGraph(MessagesAnnotation)
    .addNode("chat", async (state) => ({
        messages: [await llm.invoke(state.messages)],
    }))
    .addEdge("__start__", "chat")
    .addEdge("chat", "__end__");

// Store conversation state between turns
const checkpointer = new MemorySaver();

const app = graph.compile({ checkpointer });

const config = {
    configurable: { thread_id: "user-1" },
};



while (true) {
    const content = await rl.question(">> ");

    if (content.toLowerCase() === "exit") {
        break;
    }

    // Execute the chain
    const result = await app.invoke({
        messages: [
            { role: "user", content: content }
        ]
    }, config);

    console.log('result: ', result)
}
rl.close();