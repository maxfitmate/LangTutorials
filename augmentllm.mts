// Load environment variables from .env
import dotenv from "dotenv";
dotenv.config();

// Import necessary LangChain components
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";


const openaiApiKey = process.env.OPENAI_API_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;

// ensure both keys are present
if (!openaiApiKey || !tavilyApiKey) {
  throw new Error("Missing OPENAI_API_KEY or TAVILY_API_KEY in environment variables");
}

const llm = new ChatOpenAI({
  model: "gpt-4",
  apiKey: openaiApiKey,
});

// Define a search query tool instead of using structured output
const searchQueryTool = tool(
  async ({ searchQuery, justification }) => {
    return { searchQuery, justification };
  },
  {
    name: "search_query",
    description: "Generate a search query with justification",
    schema: z.object({
      searchQuery: z.string().describe("Query that is optimized web search."),
      justification: z.string().describe("Why this query is relevant to the user's request."),
    }),
  }
);

// Augment the LLM with the search query tool
const llmWithSearchTool = llm.bindTools([searchQueryTool]);

// Invoke the augmented LLM
const searchResponse = await llmWithSearchTool.invoke(
  "How does Calcium CT score relate to high cholesterol? Please use the search_query tool."
);

console.log("Search Query Response:");
console.log(searchResponse.tool_calls);

const multiply = tool(
  async ({ a, b }) => {
    return a * b;
  },
  {
    name: "multiply",
    description: "multiplies two numbers together",
    schema: z.object({
      a: z.number().describe("the first number"),
      b: z.number().describe("the second number"),
    }),
  }
);

// Augment the LLM with tools
const llmWithTools = llm.bindTools([multiply]);

// Invoke the LLM with input that triggers the tool call
const message = await llmWithTools.invoke("What is 2 times 3?");

console.log(message.tool_calls);


// npx tsx augmentllm.mts
