import OpenAI from "openai";
import { storage } from "./storage";
import type { FitnessMetric } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function generateDailyInsight(userId: string): Promise<string> {
  // Get last 7 days of metrics
  const metrics = await storage.getFitnessMetrics(userId, 7);
  
  if (metrics.length === 0) {
    return "• Sync your Google Fit data to get started\n• Receive personalized AI insights daily\n• Track health and performance trends";
  }
  
  // Prepare data summary for AI
  const dataSummary = prepareDataSummary(metrics);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert fitness and health analyst. Analyze the user's fitness data and provide 3 focused, scannable insights as bullet points. Each insight should be ONE short sentence (max 12 words).

Format EXACTLY as:
• [Insight 1]
• [Insight 2]  
• [Insight 3]

Focus on:
- Sleep quality vs. Recovery
- Heart rate variability vs. Workout intensity
- Energy trends and patterns

Be specific, data-driven, and motivating. Use active language.`,
        },
        {
          role: "user",
          content: `Analyze this week's fitness data and provide exactly 3 bullet points:\n\n${dataSummary}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    
    const insight = completion.choices[0]?.message?.content || 
      "• Your biometric data shows consistent patterns\n• Recovery metrics are within normal range\n• Keep monitoring your progress for trends";
    
    // Save the insight to database
    await storage.saveInsight({
      userId,
      content: insight,
      type: "daily",
      isRead: false,
    });
    
    return insight;
  } catch (error: any) {
    console.error("Error generating AI insight:", error.message);
    return "• Unable to generate insights at the moment\n• Your data trends look stable overall\n• Try syncing more fitness data";
  }
}

function prepareDataSummary(metrics: FitnessMetric[]): string {
  const latest = metrics[metrics.length - 1];
  const previous = metrics[metrics.length - 2];
  
  let summary = `Recent Metrics (last ${metrics.length} days):\n\n`;
  
  // Latest day summary
  summary += `Latest Day (${latest.date}):\n`;
  if (latest.rhr !== null && latest.rhr !== undefined) summary += `- Resting Heart Rate: ${latest.rhr} bpm\n`;
  if (latest.hrv !== null && latest.hrv !== undefined) summary += `- HRV: ${latest.hrv}\n`;
  if (latest.sleepScore !== null && latest.sleepScore !== undefined) summary += `- Sleep Score: ${latest.sleepScore}/100\n`;
  if (latest.deepSleepMinutes !== null && latest.deepSleepMinutes !== undefined) summary += `- Deep Sleep: ${latest.deepSleepMinutes} minutes\n`;
  if (latest.steps !== null && latest.steps !== undefined) summary += `- Steps: ${latest.steps.toLocaleString()}\n`;
  if (latest.calories !== null && latest.calories !== undefined) summary += `- Calories: ${latest.calories}\n`;
  if (latest.recoveryScore !== null && latest.recoveryScore !== undefined) summary += `- Recovery Score: ${latest.recoveryScore}/100\n`;
  
  // Trends (if we have previous data)
  if (previous) {
    summary += `\nChanges from Previous Day:\n`;
    if (latest.rhr !== null && latest.rhr !== undefined && previous.rhr !== null && previous.rhr !== undefined) {
      const diff = latest.rhr - previous.rhr;
      summary += `- RHR: ${diff > 0 ? '+' : ''}${diff} bpm\n`;
    }
    if (latest.sleepScore !== null && latest.sleepScore !== undefined && previous.sleepScore !== null && previous.sleepScore !== undefined) {
      const diff = latest.sleepScore - previous.sleepScore;
      summary += `- Sleep Score: ${diff > 0 ? '+' : ''}${diff}\n`;
    }
    if (latest.steps !== null && latest.steps !== undefined && previous.steps !== null && previous.steps !== undefined) {
      const diff = latest.steps - previous.steps;
      summary += `- Steps: ${diff > 0 ? '+' : ''}${diff.toLocaleString()}\n`;
    }
  }
  
  // Weekly averages
  const avgRhr = average(metrics.map(m => m.rhr).filter(v => v !== null && v !== undefined) as number[]);
  const avgSleep = average(metrics.map(m => m.sleepScore).filter(v => v !== null && v !== undefined) as number[]);
  const avgSteps = average(metrics.map(m => m.steps).filter(v => v !== null && v !== undefined) as number[]);
  
  summary += `\nWeekly Averages:\n`;
  if (avgRhr !== null) summary += `- Avg RHR: ${Math.round(avgRhr)} bpm\n`;
  if (avgSleep !== null) summary += `- Avg Sleep Score: ${Math.round(avgSleep)}/100\n`;
  if (avgSteps !== null) summary += `- Avg Steps: ${Math.round(avgSteps).toLocaleString()}\n`;
  
  return summary;
}

function average(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
