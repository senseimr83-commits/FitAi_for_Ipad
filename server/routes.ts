import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { getAuthUrl, exchangeCodeForTokens, fetchGoogleFitData, transformGoogleFitData } from "./googleFit";
import { generateDailyInsight } from "./aiInsights";
import { insertFitnessMetricSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // ============== AUTH ROUTES ==============
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============== GOOGLE FIT ROUTES ==============
  
  // DEBUG: List available Google Fit data sources
  app.get('/api/google-fit/datasources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { getValidAccessToken, getOAuth2Client } = await import('./googleFit');
      const { google } = await import('googleapis');
      
      const accessToken = await getValidAccessToken(userId);
      
      // Create OAuth2 client and set credentials
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const fitness = google.fitness({ version: 'v1', auth: oauth2Client });
      
      const response = await fitness.users.dataSources.list({ userId: 'me' });
      
      res.json({
        message: "Available Google Fit Data Sources",
        dataSources: response.data.dataSource?.map((ds: any) => ({
          dataStreamId: ds.dataStreamId,
          dataType: ds.dataType?.name,
          device: ds.device?.model || 'Unknown',
          application: ds.application?.name || 'Unknown',
        })) || [],
        totalSources: response.data.dataSource?.length || 0,
      });
    } catch (error: any) {
      console.error("Error listing data sources:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // DEBUG: Show OAuth configuration
  app.get('/api/google-fit/debug', isAuthenticated, async (req: any, res) => {
    const protocol = req.protocol;
    const hostname = req.hostname;
    const host = req.get('host');
    const originalUrl = req.originalUrl;
    
    const constructedRedirectUri = `https://${hostname}/api/google-fit/callback`;
    const alternativeRedirectUri = `https://${host}/api/google-fit/callback`;
    
    res.json({
      message: "Google OAuth Debug Information",
      currentRequest: {
        protocol,
        hostname,
        host,
        originalUrl,
        fullUrl: `${protocol}://${host}${originalUrl}`,
      },
      redirectUris: {
        constructed: constructedRedirectUri,
        alternative: alternativeRedirectUri,
        recommended: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/google-fit/callback`,
      },
      googleCloudConsoleInstructions: {
        step1: "Go to https://console.cloud.google.com/apis/credentials",
        step2: "Click on your OAuth 2.0 Client ID",
        step3: "Under 'Authorized redirect URIs', add BOTH of these:",
        urisToAdd: [
          constructedRedirectUri,
          alternativeRedirectUri,
          `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/google-fit/callback`,
        ],
        step4: "Click 'Save'",
        step5: "Wait 5 minutes for changes to propagate",
      },
      currentEnv: {
        REPL_SLUG: process.env.REPL_SLUG || "not-set",
        REPL_OWNER: process.env.REPL_OWNER || "not-set",
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      }
    });
  });
  
  // Initiate Google Fit OAuth flow
  app.get('/api/google-fit/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Use req.get('host') instead of req.hostname to include port if needed
      const redirectUri = `https://${req.get('host')}/api/google-fit/callback`;
      const authUrl = getAuthUrl(userId, redirectUri);
      
      console.log('[Google Fit Connect] Redirect URI:', redirectUri);
      console.log('[Google Fit Connect] Auth URL:', authUrl);
      
      res.json({ authUrl, redirectUri });
    } catch (error: any) {
      console.error("Error initiating Google Fit connection:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Google Fit OAuth callback
  app.get('/api/google-fit/callback', async (req, res) => {
    const { code, state: userId, error } = req.query;

    // Log all incoming parameters for debugging
    console.log('[Google Fit Callback] Received:', {
      code: code ? 'present' : 'missing',
      userId,
      error,
      fullUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    });

    if (error) {
      console.error('[Google Fit Callback] OAuth error:', error);
      return res.redirect(`/?error=${error}`);
    }

    if (!code || !userId) {
      console.error('[Google Fit Callback] Missing code or state');
      return res.status(400).send('Missing code or state parameter');
    }

    try {
      const redirectUri = `https://${req.get('host')}/api/google-fit/callback`;
      console.log('[Google Fit Callback] Using redirect URI:', redirectUri);
      
      await exchangeCodeForTokens(code as string, userId as string, redirectUri);
      
      // Redirect back to app
      res.redirect('/?connected=true');
    } catch (error: any) {
      console.error("Error in Google Fit callback:", error);
      res.redirect('/?error=connection_failed');
    }
  });

  // Check Google Fit connection status
  app.get('/api/google-fit/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const token = await storage.getGoogleFitToken(userId);
      res.json({ connected: !!token, expiresAt: token?.expiresAt });
    } catch (error: any) {
      console.error("Error checking Google Fit status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Disconnect Google Fit
  app.delete('/api/google-fit/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteGoogleFitToken(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error disconnecting Google Fit:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Sync Google Fit data
  app.post('/api/google-fit/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.body;

      // Default to last 30 days if not specified
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log(`[Google Fit Sync] Starting sync for user ${userId} from ${start} to ${end}`);

      const data = await fetchGoogleFitData(userId, start, end);
      const transformedMetrics = transformGoogleFitData(data, userId);

      console.log(`[Google Fit Sync] Transformed ${transformedMetrics.length} days of metrics`);

      // Save metrics to database
      await storage.saveFitnessMetrics(transformedMetrics);

      console.log(`[Google Fit Sync] Successfully saved metrics to database`);

      // Generate AI insight after successful sync
      try {
        console.log(`[Google Fit Sync] Generating AI insight...`);
        await generateDailyInsight(userId);
        console.log(`[Google Fit Sync] AI insight generated successfully`);
      } catch (insightError: any) {
        console.error(`[Google Fit Sync] Failed to generate AI insight:`, insightError.message);
        // Don't fail the sync if insight generation fails
      }

      res.json({ 
        success: true, 
        synced: transformedMetrics.length,
        message: `Successfully synced ${transformedMetrics.length} days of fitness data`,
        details: {
          startDate: start,
          endDate: end,
          metricsCount: transformedMetrics.length,
        }
      });
    } catch (error: any) {
      console.error("[Google Fit Sync] Error:", error);
      res.status(500).json({ 
        success: false,
        message: error.message,
        errorType: error.name || 'UnknownError',
        details: 'Check server logs for more information'
      });
    }
  });

  // ============== FITNESS METRICS ROUTES ==============
  
  // Get user's fitness metrics
  app.get('/api/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 30;
      const metrics = await storage.getFitnessMetrics(userId, days);
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add/update a single fitness metric
  app.post('/api/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const metricData = insertFitnessMetricSchema.parse({
        ...req.body,
        userId,
      });
      
      const metric = await storage.upsertFitnessMetric(metricData);
      res.json(metric);
    } catch (error: any) {
      console.error("Error saving metric:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // ============== AI INSIGHTS ROUTES ==============
  
  // Get latest AI insight
  app.get('/api/insights/latest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insight = await storage.getLatestInsight(userId);
      res.json(insight || { content: "No insights yet. Sync your Google Fit data to get started!" });
    } catch (error: any) {
      console.error("Error fetching insight:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Generate new AI insight
  app.post('/api/insights/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insight = await generateDailyInsight(userId);
      res.json({ content: insight });
    } catch (error: any) {
      console.error("Error generating insight:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Mark insight as read
  app.patch('/api/insights/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const insightId = parseInt(req.params.id);
      await storage.markInsightAsRead(insightId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking insight as read:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
