import {
  users,
  googleFitTokens,
  fitnessMetrics,
  insights,
  type User,
  type UpsertUser,
  type GoogleFitToken,
  type InsertGoogleFitToken,
  type FitnessMetric,
  type InsertFitnessMetric,
  type Insight,
  type InsertInsight,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (Required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Google Fit Token operations
  getGoogleFitToken(userId: string): Promise<GoogleFitToken | undefined>;
  saveGoogleFitToken(token: InsertGoogleFitToken): Promise<GoogleFitToken>;
  updateGoogleFitToken(userId: string, token: Partial<InsertGoogleFitToken>): Promise<GoogleFitToken | undefined>;
  deleteGoogleFitToken(userId: string): Promise<void>;

  // Fitness Metrics operations
  getFitnessMetrics(userId: string, days?: number): Promise<FitnessMetric[]>;
  getFitnessMetricByDate(userId: string, date: string): Promise<FitnessMetric | undefined>;
  saveFitnessMetrics(metrics: InsertFitnessMetric[]): Promise<void>;
  upsertFitnessMetric(metric: InsertFitnessMetric): Promise<FitnessMetric>;

  // Insights operations
  getLatestInsight(userId: string): Promise<Insight | undefined>;
  saveInsight(insight: InsertInsight): Promise<Insight>;
  markInsightAsRead(insightId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Google Fit Token operations
  async getGoogleFitToken(userId: string): Promise<GoogleFitToken | undefined> {
    const [token] = await db
      .select()
      .from(googleFitTokens)
      .where(eq(googleFitTokens.userId, userId));
    return token;
  }

  async saveGoogleFitToken(tokenData: InsertGoogleFitToken): Promise<GoogleFitToken> {
    const [token] = await db
      .insert(googleFitTokens)
      .values(tokenData)
      .onConflictDoUpdate({
        target: googleFitTokens.userId,
        set: {
          ...tokenData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return token;
  }

  async updateGoogleFitToken(userId: string, tokenData: Partial<InsertGoogleFitToken>): Promise<GoogleFitToken | undefined> {
    const [token] = await db
      .update(googleFitTokens)
      .set({ ...tokenData, updatedAt: new Date() })
      .where(eq(googleFitTokens.userId, userId))
      .returning();
    return token;
  }

  async deleteGoogleFitToken(userId: string): Promise<void> {
    await db.delete(googleFitTokens).where(eq(googleFitTokens.userId, userId));
  }

  // Fitness Metrics operations
  async getFitnessMetrics(userId: string, days: number = 30): Promise<FitnessMetric[]> {
    const metrics = await db
      .select()
      .from(fitnessMetrics)
      .where(eq(fitnessMetrics.userId, userId))
      .orderBy(desc(fitnessMetrics.date))
      .limit(days);
    return metrics.reverse(); // Return oldest to newest
  }

  async getFitnessMetricByDate(userId: string, date: string): Promise<FitnessMetric | undefined> {
    const [metric] = await db
      .select()
      .from(fitnessMetrics)
      .where(and(eq(fitnessMetrics.userId, userId), eq(fitnessMetrics.date, date)));
    return metric;
  }

  async saveFitnessMetrics(metricsData: InsertFitnessMetric[]): Promise<void> {
    if (metricsData.length === 0) return;
    
    // Insert each metric individually to handle conflicts
    for (const metric of metricsData) {
      await this.upsertFitnessMetric(metric);
    }
  }

  async upsertFitnessMetric(metricData: InsertFitnessMetric): Promise<FitnessMetric> {
    const enrichedMetric = { ...metricData };
    
    // First try to find existing metric
    const existing = await this.getFitnessMetricByDate(metricData.userId, metricData.date);
    
    if (existing) {
      // Update existing
      const [updated] = await db
        .update(fitnessMetrics)
        .set({ ...enrichedMetric, updatedAt: new Date() })
        .where(and(
          eq(fitnessMetrics.userId, metricData.userId),
          eq(fitnessMetrics.date, metricData.date)
        ))
        .returning();
      
      // Recalculate sleep consistency AFTER persisting
      await this.updateSleepConsistency(metricData.userId);
      
      return updated;
    } else {
      // Insert new
      const [metric] = await db
        .insert(fitnessMetrics)
        .values(enrichedMetric)
        .returning();
      
      // Recalculate sleep consistency AFTER persisting
      await this.updateSleepConsistency(metricData.userId);
      
      return metric;
    }
  }
  
  async updateSleepConsistency(userId: string): Promise<void> {
    // Get ALL metrics to ensure complete historical consistency calculation
    const allMetrics = await db
      .select()
      .from(fitnessMetrics)
      .where(eq(fitnessMetrics.userId, userId))
      .orderBy(asc(fitnessMetrics.date));
    
    if (allMetrics.length < 3) return;
    
    // Calculate consistency for each day (using preceding days)
    for (let i = 2; i < allMetrics.length; i++) {
      const metric = allMetrics[i];
      const precedingMetrics = allMetrics.slice(Math.max(0, i - 7), i);
      
      if (metric.sleepScore !== null && metric.sleepScore !== undefined && precedingMetrics.length >= 2) {
        const sleepScores = precedingMetrics
          .map(m => m.sleepScore)
          .filter(score => score !== null && score !== undefined) as number[];
        sleepScores.push(metric.sleepScore);
        
        const avg = sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length;
        const variance = sleepScores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / sleepScores.length;
        const stdDev = Math.sqrt(variance);
        
        const sleepConsistency = Math.round(Math.max(0, 100 - (stdDev * 2)));
        
        await db
          .update(fitnessMetrics)
          .set({ sleepConsistency })
          .where(and(
            eq(fitnessMetrics.userId, userId),
            eq(fitnessMetrics.date, metric.date)
          ));
      }
    }
  }

  // Insights operations
  async getLatestInsight(userId: string): Promise<Insight | undefined> {
    const [insight] = await db
      .select()
      .from(insights)
      .where(eq(insights.userId, userId))
      .orderBy(desc(insights.generatedAt))
      .limit(1);
    return insight;
  }

  async saveInsight(insightData: InsertInsight): Promise<Insight> {
    const [insight] = await db
      .insert(insights)
      .values(insightData)
      .returning();
    return insight;
  }

  async markInsightAsRead(insightId: number): Promise<void> {
    await db
      .update(insights)
      .set({ isRead: true })
      .where(eq(insights.id, insightId));
  }
}

export const storage = new DatabaseStorage();
