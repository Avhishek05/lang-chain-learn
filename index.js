// passing one input to chat 1 the output of chan 1 to chan 2 

//Section 1

// import { ChatOllama } from "@langchain/ollama";
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { StringOutputParser } from "@langchain/core/output_parsers";

// // Connect to the local Ollama model
// const llm = new ChatOllama({
//   model: "qwen2.5:3b",
//   temperature: 0,
// });

// // Create a prompt template
// const prompt = ChatPromptTemplate.fromTemplate(
//   "Explain {topic} in 3 words."
// );

// // Create a chain
// const chain = prompt.pipe(llm).pipe(new StringOutputParser());

// // Run the chain
// const result = await chain.invoke({
//   topic: "LangChain",
// });

// console.log(result);




//Section 2

import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough } from "@langchain/core/runnables";

// Connect to your local Ollama model
const llm = new Ollama({
  model: "qwen2.5:3b",
});

// Create the prompt template
const codePrompt = new PromptTemplate({
  template: "Write a very short {language} function that will {task}",
  inputVariables: ["language", "task"],
});

const testPrompt = new PromptTemplate({
    template: "write a test for following {language} code: \n {code}",
    inputVariables: ["language", "code"],
  });

// // Create the chain
// const codeChain = codePrompt.pipe(llm);
// Create a chain with an output key
const codeChain = RunnablePassthrough.assign({
    output: codePrompt.pipe(llm),
  });

const testChain = RunnablePassthrough.assign({
    test: testPrompt.pipe(llm),
  });

  const sequentialChain = codeChain.pipe(async (obj) => {
    console.log('obj', obj)
    return await testChain.invoke({ language: obj.language, code: obj.output });
  });
// Execute
const result = await sequentialChain.invoke({
    language: "python",
    task: 'write a bubble sort code'
  });
// // Run the chain
// const result = await codeChain.invoke({
//   language: "python",
//   task: "return a list of numbers",
// });

console.log(result);
