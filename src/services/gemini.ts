import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface JobMatch {
  score: number;
  reasoning: string;
  tailoredCoverLetter: string;
  tailoredSummary: string;
  jobTitle?: string;
  company?: string;
}

export async function searchRemoteJobs(query: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `STRICT REQUIREMENT: Find 5 recent job openings that are 100% REMOTE for: ${query}. 
    Do NOT include hybrid or on-site roles.
    Provide the output as a JSON array of objects with 'title', 'company', 'description', and 'link' fields.
    If you can't find a direct link, provide a search query link.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            company: { type: "string" },
            description: { type: "string" },
            link: { type: "string" },
          },
          required: ["title", "company", "description", "link"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse search results", e);
    return [];
  }
}

export async function analyzeAndTailor(resume: string, jobDescription: string): Promise<JobMatch> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Resume:
      ${resume}

      Job Description:
      ${jobDescription}

      Task:
      1. Analyze the match between the resume and the job description.
      2. Provide a match score (0-100).
      3. Provide brief reasoning.
      4. Write a highly tailored, professional cover letter.
      5. Write a tailored professional summary for the resume.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          score: { type: "number" },
          reasoning: { type: "string" },
          tailoredCoverLetter: { type: "string" },
          tailoredSummary: { type: "string" },
        },
        required: ["score", "reasoning", "tailoredCoverLetter", "tailoredSummary"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as JobMatch;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to analyze job match");
  }
}
