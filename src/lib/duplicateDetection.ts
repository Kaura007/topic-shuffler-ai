import { pipeline } from '@huggingface/transformers';
import { supabase } from '@/integrations/supabase/client';

let embeddingPipeline: any = null;

// Initialize the embedding pipeline
export const initializeEmbeddings = async () => {
  if (!embeddingPipeline) {
    try {
      // Use a smaller, faster model for embeddings
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'mixedbread-ai/mxbai-embed-xsmall-v1',
        { device: 'webgpu', revision: 'main' }
      );
    } catch (error) {
      // Fallback to CPU if WebGPU fails
      console.warn('WebGPU not available, falling back to CPU');
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'mixedbread-ai/mxbai-embed-xsmall-v1'
      );
    }
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

// Extract text content from a paper/project
export const extractTextFromPaper = (paper: any): string => {
  const title = paper.title || '';
  const abstract = paper.abstract || '';
  const authors = Array.isArray(paper.authors) 
    ? paper.authors.join(' ') 
    : paper.authors || '';
  
  return `${title} ${abstract} ${authors}`.trim();
};

// Extract text content from a database project
export const extractTextFromProject = (project: any): string => {
  const title = project.title || '';
  const abstract = project.abstract || '';
  
  return `${title} ${abstract}`.trim();
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

// Check if a new project is similar to existing projects in the database
export const checkProjectForDuplicates = async (
  newProject: { title: string; abstract: string },
  threshold: number = 0.75,
  excludeProjectId?: string
): Promise<Array<{ project: any, similarity: number }>> => {
  try {
    // Fetch existing projects from database
    let query = supabase
      .from('projects')
      .select('id, title, abstract, year, profiles!projects_student_id_fkey(name)');
    
    if (excludeProjectId) {
      query = query.neq('id', excludeProjectId);
    }
    
    const { data: existingProjects, error } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    if (!existingProjects || existingProjects.length === 0) {
      return [];
    }

    // Generate embedding for the new project
    const newProjectText = extractTextFromProject(newProject);
    const newProjectEmbedding = await generateEmbedding(newProjectText);

    // Check similarity against all existing projects
    const duplicates: Array<{ project: any, similarity: number }> = [];
    
    for (const existingProject of existingProjects) {
      const existingProjectText = extractTextFromProject(existingProject);
      const existingProjectEmbedding = await generateEmbedding(existingProjectText);
      
      const similarity = cosineSimilarity(newProjectEmbedding, existingProjectEmbedding);
      
      if (similarity >= threshold) {
        duplicates.push({
          project: existingProject,
          similarity
        });
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return [];
  }
};

// Simple text-based similarity check (faster, for real-time checking)
export const quickSimilarityCheck = (text1: string, text2: string): number => {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  
  const normalized1 = normalize(text1);
  const normalized2 = normalize(text2);
  
  if (normalized1 === normalized2) return 1.0;
  
  const words1 = new Set(normalized1.split(/\s+/));
  const words2 = new Set(normalized2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size; // Jaccard similarity
};

// Quick database check for potential duplicates (text-based)
export const quickDuplicateCheck = async (
  title: string,
  abstract: string = '',
  excludeProjectId?: string
): Promise<Array<{ project: any, similarity: number }>> => {
  try {
    let query = supabase
      .from('projects')
      .select('id, title, abstract, year, profiles!projects_student_id_fkey(name)');
    
    if (excludeProjectId) {
      query = query.neq('id', excludeProjectId);
    }
    
    const { data: projects, error } = await query;
    
    if (error || !projects) return [];

    const duplicates: Array<{ project: any, similarity: number }> = [];
    const inputText = `${title} ${abstract}`.toLowerCase();

    for (const project of projects) {
      const projectText = `${project.title} ${project.abstract}`.toLowerCase();
      
      // Check title similarity
      const titleSimilarity = quickSimilarityCheck(title, project.title);
      
      // Check combined text similarity
      const textSimilarity = quickSimilarityCheck(inputText, projectText);
      
      // Use the higher similarity score
      const maxSimilarity = Math.max(titleSimilarity, textSimilarity);
      
      if (maxSimilarity >= 0.6) { // Lower threshold for quick check
        duplicates.push({
          project,
          similarity: maxSimilarity
        });
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Error in quick duplicate check:', error);
    return [];
  }
};