import { pipeline } from '@huggingface/transformers';

let embeddingPipeline: any = null;

// Initialize the embedding pipeline
export const initializeEmbeddings = async () => {
  if (!embeddingPipeline) {
    // Use a smaller, faster model for embeddings
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'mixedbread-ai/mxbai-embed-xsmall-v1',
      { device: 'webgpu' }
    );
  }
  return embeddingPipeline;
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// Extract text content from a paper
export const extractTextFromPaper = (paper: any): string => {
  const title = paper.title || '';
  const abstract = paper.abstract || '';
  const authors = Array.isArray(paper.authors) 
    ? paper.authors.join(' ') 
    : paper.authors || '';
  
  return `${title} ${abstract} ${authors}`.trim();
};

// Generate embeddings for text
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const pipeline = await initializeEmbeddings();
  const result = await pipeline(text, { pooling: 'mean', normalize: true });
  return Array.from(result.data);
};

// Find duplicates in a list of papers
export const findDuplicates = async (
  papers: any[], 
  threshold: number = 0.85,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ paper1: any, paper2: any, similarity: number }>> => {
  const duplicates: Array<{ paper1: any, paper2: any, similarity: number }> = [];
  
  // Generate embeddings for all papers
  const embeddings: number[][] = [];
  for (let i = 0; i < papers.length; i++) {
    const text = extractTextFromPaper(papers[i]);
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
    onProgress?.(i + 1, papers.length * 2); // First half of progress
  }
  
  // Compare all pairs
  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
      
      if (similarity >= threshold) {
        duplicates.push({
          paper1: papers[i],
          paper2: papers[j],
          similarity
        });
      }
      
      onProgress?.(papers.length + (i * papers.length + j), papers.length * 2);
    }
  }
  
  return duplicates.sort((a, b) => b.similarity - a.similarity);
};