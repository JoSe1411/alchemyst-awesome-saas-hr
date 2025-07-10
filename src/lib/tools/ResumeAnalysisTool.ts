import { Tool } from 'langchain/tools';
import { ChatOpenAI } from '@langchain/openai';
import { EnhancedMemoryManager } from '../EnhancedMemoryManager';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ToolInput {
  resumeContent?: string;
  fileId?: string;
  candidateId: string;
  jobRequirementsPath?: string;
}

interface ResumeAnalysisResult {
  candidateId: string;
  scores: Record<string, number>;
  recommendation: string;
  reasoning: string[];
  fitScore: number;
  missingRequirements: string[];
  strengths: string[];
  storedAt?: string;
}

/**
 * LangChain Tool for analyzing resumes against job requirements
 */
export class ResumeAnalysisTool extends Tool {
  name = 'resume_analyzer';
  description = `Analyzes candidate resumes against job requirements and provides detailed scoring and recommendations.
  
  Input should be a JSON string with:
  - candidateId: Unique identifier for the candidate
  - resumeContent: Text content of the resume (optional if fileId provided)
  - fileId: File ID for uploaded resume (optional if resumeContent provided)
  - jobRequirementsPath: Path to job requirements file (defaults to ChronosPeople requirements)
  
  Returns comprehensive analysis with scores, fit assessment, and recommendations.`;

  private memoryManager: EnhancedMemoryManager;
  private llm: ChatOpenAI;

  constructor(memoryManager: EnhancedMemoryManager, llm: ChatOpenAI) {
    super();
    this.memoryManager = memoryManager;
    this.llm = llm;
  }

  async _call(input: string): Promise<string> {
    try {
      // Parse input
      const parsedInput: ToolInput = JSON.parse(input);
      const { candidateId, resumeContent, fileId, jobRequirementsPath } = parsedInput;

      if (!candidateId) {
        throw new Error('candidateId is required');
      }

      // Get resume content
      let resumeText = resumeContent;
      if (!resumeText && fileId) {
        // In a real implementation, you'd retrieve the file content from storage
        // For now, we'll use the fileId as a placeholder
        resumeText = `Resume file with ID: ${fileId}`;
      }

      if (!resumeText) {
        throw new Error('Either resumeContent or valid fileId must be provided');
      }

      // Get job requirements
      const requirementsPath = jobRequirementsPath || 'CompanyRequirements/Imaginary Hiring Scenario – ChronosPeople Inc..md';
      const jobRequirements = await this.loadJobRequirements(requirementsPath);

      // Perform analysis
      const analysis = await this.analyzeResume(resumeText, jobRequirements, candidateId);

      return JSON.stringify({
        success: true,
        cached: false,
        analysis,
        message: `Completed analysis for candidate ${candidateId} with fit score: ${analysis.fitScore}%`
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to analyze resume'
      });
    }
  }

  /**
   * Load job requirements from markdown file
   */
  private async loadJobRequirements(filePath: string): Promise<string> {
    try {
      const fullPath = join(process.cwd(), filePath);
      const content = readFileSync(fullPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to load job requirements from ${filePath}: ${error}`);
    }
  }

  /**
   * Analyze resume against job requirements using LLM
   */
  private async analyzeResume(
    resumeContent: string, 
    jobRequirements: string, 
    candidateId: string
  ): Promise<ResumeAnalysisResult> {
    
    // Create analysis prompt
    const analysisPrompt = `
You are an expert HR analyst. Analyze this resume against the job requirements and provide a detailed assessment.

JOB REQUIREMENTS:
${jobRequirements}

CANDIDATE RESUME:
${resumeContent}

Provide your analysis in the following JSON format:
{
  "candidateId": "${candidateId}",
  "scores": {
    "technical_skills": 0-100,
    "experience": 0-100,
    "education": 0-100,
    "domain_expertise": 0-100,
    "soft_skills": 0-100,
    "culture_fit": 0-100
  },
  "fitScore": 0-100,
  "recommendation": "STRONG_FIT|GOOD_FIT|MODERATE_FIT|WEAK_FIT|NO_FIT",
  "reasoning": [
    "Detailed reasoning point 1",
    "Detailed reasoning point 2",
    "etc..."
  ],
  "strengths": [
    "Key strength 1",
    "Key strength 2",
    "etc..."
  ],
  "missingRequirements": [
    "Missing requirement 1",
    "Missing requirement 2",
    "etc..."
  ]
}

Be thorough and specific in your analysis. Consider:
1. Technical requirements match
2. Experience level and relevance
3. Education and certifications
4. Domain-specific knowledge
5. Soft skills and leadership
6. Cultural fit indicators
7. Growth potential

Provide honest, constructive feedback that would help in hiring decisions.
`;

    try {
      // Use the LLM for analysis
      const llmResponse = await this.llm.invoke(analysisPrompt);
      
      // Extract JSON from response (handle potential markdown formatting)
      const responseContent = llmResponse.content as string;
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('LLM response does not contain valid JSON');
      }

      const analysisResult = JSON.parse(jsonMatch[0]) as ResumeAnalysisResult;
      
      // Validate and ensure all required fields
      return {
        candidateId,
        scores: analysisResult.scores || {},
        recommendation: analysisResult.recommendation || 'NO_FIT',
        reasoning: analysisResult.reasoning || ['Analysis could not be completed'],
        fitScore: analysisResult.fitScore || 0,
        missingRequirements: analysisResult.missingRequirements || [],
        strengths: analysisResult.strengths || [],
        storedAt: new Date().toISOString()
      };

    } catch (error) {
      // Fallback analysis if LLM fails
      return {
        candidateId,
        scores: {
          technical_skills: 50,
          experience: 50,
          education: 50,
          domain_expertise: 50,
          soft_skills: 50,
          culture_fit: 50
        },
        recommendation: 'NO_FIT',
        reasoning: [`Analysis failed: ${error}`],
        fitScore: 0,
        missingRequirements: ['Analysis could not be completed'],
        strengths: [],
        storedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Helper method to get analysis summary for multiple candidates
   */
  async getCandidateComparison(): Promise<string> {
    return JSON.stringify({
      success: false,
      message: 'Candidate comparison is not available without persistent storage. Analyze candidates individually.'
    });
  }
} 