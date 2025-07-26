import {
    VectorStoreIndex,
    Document,
    Settings,
  } from "llamaindex";
  import { SimpleDirectoryReader } from "@llamaindex/readers/directory";
  import { openai, OpenAIEmbedding } from "@llamaindex/openai";
  import path from "path";
  
  // Ensure API Key is available from environment variables
  const openAIApiKey = process.env.OPENAI_API_KEY;
  
  // Log an error if the API key is not set, as it's critical for LlamaIndex operations.
  if (!openAIApiKey) {
    console.error("CRITICAL ERROR: OPENAI_API_KEY environment variable is not set. LlamaIndex will not function correctly.");
    // In a production application, you might want to exit or disable features here.
  }
  
  // Configure the embedding model. This is essential for VectorStoreIndex to create embeddings.
  Settings.embedModel = new OpenAIEmbedding({
    model: "text-embedding-ada-002",
    apiKey: openAIApiKey, // Pass API key explicitly to the embedding model
  });
  
  // Configure the Large Language Model (LLM) for querying.
  Settings.llm = openai({
    model: "gpt-3.5-turbo",
    temperature: 0.1,
    apiKey: openAIApiKey,
  });
  
  // Cache the query engine to avoid re-loading and re-indexing data on every request.
  // This improves performance significantly for subsequent queries.
  let queryEngine: any = null; // Using 'any' for flexibility, though a more specific LlamaIndex type would be ideal.
  
  /**
   * Initializes the LlamaIndex data source.
   * This function performs the following steps:
   * 1. Checks if a query engine is already cached; if so, returns it.
   * 2. Verifies that the OpenAI API key is available.
   * 3. Defines the path to the data directory (where your documents are stored).
   * 4. Loads documents from the specified directory using SimpleDirectoryReader.
   * 5. Creates a VectorStoreIndex from the loaded documents. This process involves
   * chunking the documents, generating embeddings, and storing them for efficient retrieval.
   * 6. Creates a query engine from the index, which will be used to answer questions
   * based on the indexed data (Retrieval-Augmented Generation - RAG).
   * 7. Caches the initialized query engine for future use.
   *
   * @returns The initialized LlamaIndex query engine.
   * @throws {Error} If initialization fails at any step (e.g., no API key, no documents,
   * failure to create index or query engine).
   */
  async function getQueryEngine() {
    // If the query engine is already initialized and cached, return it immediately.
    if (queryEngine) {
      console.log("Returning cached LlamaIndex query engine.");
      return queryEngine;
    }
  
    // Ensure the OpenAI API key is set before attempting LlamaIndex initialization.
    if (!openAIApiKey) {
      const errorMessage = "LlamaIndex initialization failed: OPENAI_API_KEY is not set. Cannot proceed.";
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  
    try {
      // Construct the absolute path to the 'data' directory.
      const dataDirPath = path.join(process.cwd(), "data");
      console.log(`Attempting to load documents from: ${dataDirPath}`);
  
      // Load documents from the specified directory.
      const reader = new SimpleDirectoryReader();
      const documents = await reader.loadData({ directoryPath: dataDirPath });
      console.log(`Loaded ${documents.length} documents.`);
  
      // Warn if no documents are found, as the query engine will have no data to query.
      if (documents.length === 0) {
        console.warn("No documents found in the data directory. The LlamaIndex query engine will be empty and might not function as expected.");
      }
  
      // Create a VectorStoreIndex from the loaded documents. This is the core indexing step.
      console.log("Creating vector store index from documents...");
      const index = await VectorStoreIndex.fromDocuments(documents);
      console.log("Vector store index created successfully.");
  
      // Create the query engine from the index.
      console.log("Creating query engine from the index...");
      const engine = index.asQueryEngine();
  
      // Crucial check: Ensure that 'asQueryEngine()' actually returned a valid object.
      if (!engine) {
        throw new Error("index.asQueryEngine() returned null or undefined. Failed to create a valid query engine.");
      }
  
      // Cache the successfully created engine for future requests.
      queryEngine = engine;
      console.log("LlamaIndex query engine initialized and cached successfully.");
  
      return queryEngine;
    } catch (error: any) { // Catch any potential errors during the initialization process.
      console.error("Critical Error during LlamaIndex initialization:", error);
      // Reset queryEngine to null to force re-initialization on the next attempt if it failed.
      queryEngine = null;
      throw new Error(`Failed to initialize LlamaIndex: ${error.message}. Please verify your data directory, OpenAI API key, and LlamaIndex setup.`);
    }
  }
  
  /**
   * Chats with the LlamaIndex agent using the initialized query engine.
   * This function retrieves the query engine and then sends the user's message to it.
   *
   * @param message The user's query string.
   * @returns A Promise that resolves to the response string from the LlamaIndex agent.
   * @throws {Error} If the query engine cannot be initialized or if an error occurs during the query.
   */
  export async function chatWithAgent(message: string): Promise<string> {
    let engine;
    try {
      // Attempt to get the initialized query engine. This will either return the cached one
      // or initialize it if it's the first call.
      engine = await getQueryEngine();
    } catch (initError: any) {
      console.error("Error retrieving LlamaIndex query engine:", initError);
      return `Error: Failed to initialize the LlamaIndex query engine. Details: ${initError.message}`;
    }
  
    // Double-check that the engine is valid before attempting to query it.
    // This directly addresses the "Cannot read properties of undefined (reading 'query')" error.
    if (!engine) {
      const errorMessage = "LlamaIndex query engine is not available. Initialization might have failed silently.";
      console.error(errorMessage);
      return `Error: ${errorMessage}`;
    }
  
    try {
      console.log(`Querying LlamaIndex with message: "${message}"`);
      // Send the user's message to the LlamaIndex query engine.
      // The 'extractText called with non-MessageContent message' warning might be an internal
      // LlamaIndex message. The primary goal here is to resolve the 'TypeError'.
      const response = await engine.query({ query: message });
      console.log(`LlamaIndex response: "${response.response}"`);
      return response.response;
    } catch (queryError: any) {
      console.error("Error during LlamaIndex query:", queryError);
      return `Error querying LlamaIndex: ${queryError.message}. Please ensure the query format is correct and the LlamaIndex setup is valid.`;
    }
  }
  