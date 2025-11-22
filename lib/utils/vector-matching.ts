/**
 * Vector-based semantic matching using OpenAI embeddings
 * Provides more accurate matching than keyword-based approaches
 */

import { embedMany } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length")
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Generate embedding for a text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: [text],
    })
    
    return result.embeddings[0]
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const result = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: texts,
    })
    
    return result.embeddings
  } catch (error) {
    console.error("Error generating embeddings:", error)
    throw error
  }
}

/**
 * Calculate semantic similarity between query and shop expertise
 * Returns a score between 0 and 1
 */
export async function calculateSemanticSimilarity(
  query: string,
  shopExpertise: string[],
  services?: Array<{ name: string; description?: string | null; type?: string | null }>
): Promise<number> {
  try {
    // Combine shop expertise and services into a single text
    const shopTexts: string[] = []
    
    // Add expertise
    shopExpertise.forEach(exp => {
      shopTexts.push(exp)
    })
    
    // Add services
    if (services) {
      services.forEach(service => {
        if (service.name) {
          shopTexts.push(service.name)
        }
        if (service.description) {
          shopTexts.push(service.description)
        }
        if (service.type) {
          shopTexts.push(service.type)
        }
      })
    }
    
    if (shopTexts.length === 0) {
      return 0
    }
    
    // Generate embeddings
    const [queryEmbedding, ...shopEmbeddings] = await generateEmbeddings([query, ...shopTexts])
    
    // Calculate similarity with each shop text and take the maximum
    let maxSimilarity = 0
    for (const shopEmbedding of shopEmbeddings) {
      const similarity = cosineSimilarity(queryEmbedding, shopEmbedding)
      maxSimilarity = Math.max(maxSimilarity, similarity)
    }
    
    return maxSimilarity
  } catch (error) {
    console.error("Error calculating semantic similarity:", error)
    // Fallback to 0 if embedding fails
    return 0
  }
}

/**
 * Build a query string from diagnosis for semantic matching
 */
export function buildSemanticQuery(diagnosis: {
  device_brand?: string
  device_type?: string
  device_category?: string
  repair_component?: string
  repair_keywords?: string[]
}): string {
  const parts: string[] = []
  
  if (diagnosis.device_category) {
    parts.push(diagnosis.device_category)
  }
  
  if (diagnosis.device_brand) {
    parts.push(diagnosis.device_brand)
  }
  
  if (diagnosis.device_type) {
    parts.push(diagnosis.device_type)
  }
  
  if (diagnosis.repair_component) {
    parts.push(diagnosis.repair_component)
  }
  
  if (diagnosis.repair_keywords && diagnosis.repair_keywords.length > 0) {
    parts.push(...diagnosis.repair_keywords)
  }
  
  return parts.join(" ")
}

