// in addition to index2.js create summary also of last msges so that less tokens are used in long chatsimport readline from "node:readline/promises";

import { ChatOllama } from "@langchain/ollama";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  StateGraph,
  MessagesAnnotation,
  Annotation,
  MemorySaver,
  START,
  END,
} from "@langchain/langgraph";
import {
  HumanMessage,
  SystemMessage,
  RemoveMessage,
} from "@langchain/core/messages";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Same as: chat = ChatOpenAI()
const chat = new ChatOllama({
  model: "qwen2.5:3b",
  temperature: 0,
});

// Same as: ConversationSummaryMemory(...)
const memory = new MemorySaver();

// Same as: ChatPromptTemplate(...)
const prompt = ChatPromptTemplate.fromMessages([
  new MessagesPlaceholder("messages"),
  ["human", "{content}"],
]);

// State used by LangGraph
const ChatState = Annotation.Root({
  ...MessagesAnnotation.spec,

  content: Annotation({
    reducer: (_, update) => update,
    default: () => "",
  }),

  summary: Annotation({
    reducer: (_, update) => update,
    default: () => "",
  }),
});

// Same role as the LLMChain call
async function chain(state) {
  const messages = [...state.messages];

  if (state.summary) {
    messages.unshift(
      new SystemMessage(
        `Summary of previous conversation:\n${state.summary}`
      )
    );
  }

  const formattedPrompt = await prompt.invoke({
    messages,
    content: state.content,
  });

  const result = await chat.invoke(formattedPrompt);

  return {
    messages: [
      new HumanMessage(state.content),
      result,
    ],
  };
}

// Summarize older messages to reduce conversation history
async function summarizeConversation(state) {
  const oldMessages = state.messages.slice(0, -4);

  if (oldMessages.length === 0) {
    return {};
  }

  const summaryPrompt = [
    new SystemMessage(
      `Summarize this conversation concisely.
Preserve important facts, names, preferences, and context.
${state.summary ? `Previous summary:\n${state.summary}` : ""}`
    ),
    ...oldMessages,
  ];

  const summaryResult = await chat.invoke(summaryPrompt);

  return {
    summary: summaryResult.content,
    messages: oldMessages
      .filter((message) => message.id)
      .map((message) => new RemoveMessage({ id: message.id })),
  };
}

// Build the conversation chain
const graph = new StateGraph(ChatState)
  .addNode("chain", chain)
  .addNode("summarize", summarizeConversation)
  .addEdge(START, "chain")
  .addConditionalEdges("chain", (state) =>
    state.messages.length > 6 ? "summarize" : END
  )
  .addEdge("summarize", END);

// Compile with persistent conversation state in memory
const app = graph.compile({ checkpointer: memory });

const config = {
  configurable: {
    thread_id: "my-conversation",
  },
};

// Same role as: while True
const rl = readline.createInterface({ input, output });

try {
  while (true) {
    const content = await rl.question(">> ");

    if (content.trim().toLowerCase() === "exit") {
      break;
    }

    const result = await app.invoke({ content }, config);

    console.log("Assistant:", result.messages.at(-1).content);
  }
} finally {
  rl.close();
}
