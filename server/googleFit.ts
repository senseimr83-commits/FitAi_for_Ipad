import { google } from 'googleapis';
import { storage } from './storage';

const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
  'https://www.googleapis.com/auth/fitness.body.read',
];

export function getOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/google-fit/callback`
  );
}

export function getAuthUrl(userId: string, redirectUri?: string): string {
  const oauth2Client = getOAuth2Client(redirectUri);
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_FIT_SCOPES,
    state: userId, // Pass userId as state to retrieve it in callback
    prompt: 'consent', // Force consent to get refresh token
  });
}

export async function exchangeCodeForTokens(code: string, userId: string, redirectUri?: string) {
  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  
  // Save tokens to database
  await storage.saveGoogleFitToken({
    userId,
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || undefined,
    expiresAt: new Date(tokens.expiry_date!),
    scope: tokens.scope!,
  });
  
  return tokens;
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const tokenData = await storage.getGoogleFitToken(userId);
  
  if (!tokenData) {
    throw new Error('No Google Fit token found. Please connect your Google Fit account.');
  }
  
  const now = new Date();
  
  // If token is still valid, return it
  if (tokenData.expiresAt > now) {
    return tokenData.accessToken;
  }
  
  // Token expired, refresh it
  if (!tokenData.refreshToken) {
    throw new Error('Refresh token not available. Please reconnect your Google Fit account.');
  }
  
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokenData.refreshToken,
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  // Update tokens in database
  await storage.updateGoogleFitToken(userId, {
    accessToken: credentials.access_token!,
    expiresAt: new Date(credentials.expiry_date!),
  });
  
  return credentials.access_token!;
}

export async function fetchGoogleFitData(userId: string, startDate: string, endDate: string) {
  const accessToken = await getValidAccessToken(userId);
  
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const fitness = google.fitness({ version: 'v1', auth: oauth2Client });
  
  const startTimeMillis = new Date(startDate).getTime();
  const endTimeMillis = new Date(endDate).getTime();
  
  try {
    // Only use Google Fit Aggregate API supported data types
    // Try to fetch all metrics, but gracefully handle missing data sources
    const aggregateRequest = {
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta' },
        { dataTypeName: 'com.google.calories.expended' },
        { dataTypeName: 'com.google.sleep.segment' },
      ],
      bucketByTime: { durationMillis: '86400000' }, // 1 day buckets (must be string)
      startTimeMillis: startTimeMillis.toString(),
      endTimeMillis: endTimeMillis.toString(),
    };
    
    const response = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: aggregateRequest as any,
    });
    
    // Try to fetch heart rate and sleep data from available data sources
    // Amazfit/Zepp and other third-party apps don't work with aggregate API
    // so we fetch directly from data streams
    try {
      console.log('[Google Fit] Fetching data sources...');
      
      // Get all available data sources
      const dataSources = await fitness.users.dataSources.list({ userId: 'me' });
      
      // Find heart rate source
      const heartRateSource = dataSources.data.dataSource?.find((ds: any) => 
        ds.dataType?.name === 'com.google.heart_rate.bpm'
      );
      
      // Find sleep source
      const sleepSource = dataSources.data.dataSource?.find((ds: any) => 
        ds.dataType?.name === 'com.google.sleep.segment'
      );
      
      console.log('[Google Fit] Data sources found:', {
        heartRate: heartRateSource ? 'YES' : 'NO',
        sleep: sleepSource ? 'YES' : 'NO',
      });
      
      if (heartRateSource) {
        console.log('[Google Fit] Found heart rate data source:', heartRateSource.dataStreamId);
        
        // Fetch heart rate data directly from the data stream
        const datasetId = `${startTimeMillis * 1000000}-${endTimeMillis * 1000000}`;
        const hrData = await fitness.users.dataSources.datasets.get({
          userId: 'me',
          dataSourceId: heartRateSource.dataStreamId!,
          datasetId: datasetId,
        });
        
        // Create buckets for heart rate data
        if (hrData.data.point && hrData.data.point.length > 0) {
          console.log(`[Google Fit] Found ${hrData.data.point.length} heart rate data points`);
          
          // Group heart rate points by day
          const hrByDay = new Map<string, any[]>();
          hrData.data.point.forEach((point: any) => {
            const pointDate = new Date(parseInt(point.startTimeNanos) / 1000000);
            const dateKey = pointDate.toISOString().split('T')[0];
            
            if (!hrByDay.has(dateKey)) {
              hrByDay.set(dateKey, []);
            }
            hrByDay.get(dateKey)!.push(point);
          });
          
          // Add heart rate data to corresponding buckets
          response.data.bucket?.forEach((bucket: any) => {
            const bucketDate = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
            const hrPoints = hrByDay.get(bucketDate);
            
            if (hrPoints && hrPoints.length > 0) {
              // Create a synthetic dataset for this bucket
              const hrDataset = {
                dataSourceId: heartRateSource.dataStreamId,
                point: hrPoints,
              };
              
              bucket.dataset = [...(bucket.dataset || []), hrDataset];
            }
          });
          
          console.log('[Google Fit] Successfully integrated heart rate data into buckets');
        } else {
          console.log('[Google Fit] No heart rate data points found in date range');
        }
      }
      
      // Fetch sleep data if available
      if (sleepSource) {
        console.log('[Google Fit] Found sleep data source:', sleepSource.dataStreamId);
        
        const datasetId = `${startTimeMillis * 1000000}-${endTimeMillis * 1000000}`;
        const sleepData = await fitness.users.dataSources.datasets.get({
          userId: 'me',
          dataSourceId: sleepSource.dataStreamId!,
          datasetId: datasetId,
        });
        
        if (sleepData.data.point && sleepData.data.point.length > 0) {
          console.log(`[Google Fit] Found ${sleepData.data.point.length} sleep data points`);
          
          // Group sleep points by day
          const sleepByDay = new Map<string, any[]>();
          sleepData.data.point.forEach((point: any) => {
            const pointDate = new Date(parseInt(point.startTimeNanos) / 1000000);
            const dateKey = pointDate.toISOString().split('T')[0];
            
            if (!sleepByDay.has(dateKey)) {
              sleepByDay.set(dateKey, []);
            }
            sleepByDay.get(dateKey)!.push(point);
          });
          
          // Add sleep data to corresponding buckets
          response.data.bucket?.forEach((bucket: any) => {
            const bucketDate = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
            const sleepPoints = sleepByDay.get(bucketDate);
            
            if (sleepPoints && sleepPoints.length > 0) {
              // Create a synthetic dataset for this bucket
              const sleepDataset = {
                dataSourceId: sleepSource.dataStreamId,
                point: sleepPoints,
              };
              
              bucket.dataset = [...(bucket.dataset || []), sleepDataset];
            }
          });
          
          console.log('[Google Fit] Successfully integrated sleep data into buckets');
        } else {
          console.log('[Google Fit] No sleep data points found in date range');
        }
      }
    } catch (dataError: any) {
      console.log('[Google Fit] Error fetching additional data:', dataError.message);
      // Continue without additional data
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Google Fit data:', error.message);
    throw new Error(`Failed to fetch Google Fit data: ${error.message}`);
  }
}

// Transform Google Fit API response to our fitness metrics format
export function transformGoogleFitData(apiData: any, userId: string) {
  if (!apiData.bucket) return [];
  
  const metrics = apiData.bucket.map((bucket: any) => {
    const startDate = new Date(parseInt(bucket.startTimeMillis));
    const date = startDate.toISOString().split('T')[0];
    
    const metric: any = {
      userId,
      date,
      steps: 0,
      calories: 0,
      rhr: null,
      hrv: null,
      sleepScore: null,
      sleepConsistency: null,
      workoutIntensity: null,
      protein: 0,
      carbs: 0,
      fats: 0,
      deepSleepMinutes: null,
      spo2: null,
      recoveryScore: null,
      totalSleepMinutes: 0,
      activityMinutes: 0,
    };
    
    // Track HR readings for HRV calculation
    const hrReadings: number[] = [];
    
    // Track all data types we encounter for debugging
    const dataTypesFound = new Set<string>();
    
    // Extract data from buckets
    bucket.dataset?.forEach((dataset: any) => {
      dataset.point?.forEach((point: any) => {
        // Google Fit provides data type in multiple ways:
        // 1. dataset.dataType.name (e.g., "com.google.heart_rate.summary")
        // 2. dataset.dataSourceId split format "derived:com.google.step_count.delta:..."
        const dataTypeName = dataset.dataType?.name || 
          (() => {
            const parts = dataset.dataSourceId?.split(':') || [];
            return parts.length > 1 ? parts[1] : parts[0];
          })();
        
        dataTypesFound.add(dataTypeName);
        
        switch (dataTypeName) {
          case 'com.google.step_count.delta':
            metric.steps += point.value[0]?.intVal || 0;
            break;
          case 'com.google.calories.expended':
            metric.calories += Math.round(point.value[0]?.fpVal || 0);
            break;
          case 'com.google.heart_rate.bpm':
          case 'com.google.heart_rate.summary':
            // Zepp/Amazfit and third-party apps use fpVal directly
            // Google's own data uses mapVal with min/max/avg
            if (point.value[0]?.fpVal) {
              // Direct fpVal (Zepp/Amazfit format) - collect all HR readings
              const currentHr = Math.round(point.value[0].fpVal);
              if (currentHr > 0 && currentHr < 200) { // Sanity check
                hrReadings.push(currentHr);
                // Track minimum (for RHR) across all readings for the day
                metric.rhr = metric.rhr ? Math.min(metric.rhr, currentHr) : currentHr;
              }
            } else if (point.value[0]?.mapVal) {
              // mapVal format (Google's aggregate data)
              const minHrEntry = point.value[0].mapVal.find((m: any) => m.key === 'min');
              const avgHrEntry = point.value[0].mapVal.find((m: any) => m.key === 'average');
              
              // Use min if available, otherwise average
              const currentHr = minHrEntry 
                ? Math.round(minHrEntry.value.fpVal)
                : avgHrEntry
                ? Math.round(avgHrEntry.value.fpVal)
                : 0;
              
              if (currentHr > 0 && currentHr < 200) {
                hrReadings.push(currentHr);
                metric.rhr = metric.rhr ? Math.min(metric.rhr, currentHr) : currentHr;
              }
            }
            break;
          case 'com.google.sleep.segment':
            const sleepDuration = (point.endTimeNanos - point.startTimeNanos) / 1e9 / 60;
            const sleepType = point.value[0]?.intVal;
            
            metric.totalSleepMinutes += Math.round(sleepDuration);
            
            if (sleepType === 4) { // Deep sleep
              metric.deepSleepMinutes = (metric.deepSleepMinutes || 0) + Math.round(sleepDuration);
            }
            break;
        }
      });
    });
    
    // Log data types found for this day (for debugging)
    if (dataTypesFound.size > 0) {
      console.log(`[Google Fit] ${date}: Found data types:`, Array.from(dataTypesFound).join(', '));
    }
    
    // Calculate derived metrics
    // Sleep score based on total sleep (7-9 hours optimal)
    if (metric.totalSleepMinutes > 0) {
      const sleepHours = metric.totalSleepMinutes / 60;
      const deepSleepRatio = metric.deepSleepMinutes ? (metric.deepSleepMinutes / metric.totalSleepMinutes) : 0.15;
      
      let sleepQuality = 100;
      if (sleepHours < 7) sleepQuality = (sleepHours / 7) * 100;
      else if (sleepHours > 9) sleepQuality = 100 - ((sleepHours - 9) * 10);
      
      metric.sleepScore = Math.min(100, Math.round(sleepQuality * 0.7 + deepSleepRatio * 100 * 0.3));
    }
    
    // Recovery score based on RHR (lower is better)
    if (metric.rhr) {
      if (metric.rhr < 60) {
        metric.recoveryScore = Math.min(100, 85 + (60 - metric.rhr));
      } else {
        metric.recoveryScore = Math.max(0, 85 - (metric.rhr - 60) * 1.5);
      }
      metric.recoveryScore = Math.round(metric.recoveryScore);
    }
    
    // Workout intensity derived from steps and calories
    // High steps (>10k) or high calories (>2500) indicates higher intensity
    if (metric.steps > 0 || metric.calories > 0) {
      const stepIntensity = Math.min(100, (metric.steps / 15000) * 100); // 15k steps = max
      const calorieIntensity = Math.min(100, (metric.calories / 3000) * 100); // 3k cal = max
      metric.workoutIntensity = Math.round(Math.max(stepIntensity, calorieIntensity));
    }
    
    // Calculate HRV from heart rate variability (standard deviation of HR readings)
    if (hrReadings.length > 10) {
      const mean = hrReadings.reduce((a, b) => a + b, 0) / hrReadings.length;
      const variance = hrReadings.reduce((sum, hr) => sum + Math.pow(hr - mean, 2), 0) / hrReadings.length;
      const stdDev = Math.sqrt(variance);
      
      // Convert stdDev to a reasonable HRV metric (higher variability = healthier)
      // Typical HRV ranges from 20-100ms
      metric.hrv = Math.round(Math.min(100, Math.max(20, stdDev * 3)));
    } else if (!metric.hrv && metric.rhr) {
      // Fallback: estimate from RHR if we don't have enough readings
      metric.hrv = Math.max(20, Math.min(80, 60 - (metric.rhr - 60)));
    }
    
    // Estimate nutrition macros if not available (based on calories and activity level)
    if (metric.calories > 0 && metric.protein === 0 && metric.carbs === 0 && metric.fats === 0) {
      const isActiveDay = metric.steps > 8000;
      if (isActiveDay) {
        // Active day macro split (30% protein, 50% carbs, 20% fat)
        metric.protein = Math.round((metric.calories * 0.30) / 4); // 4 cal/g protein
        metric.carbs = Math.round((metric.calories * 0.50) / 4); // 4 cal/g carbs
        metric.fats = Math.round((metric.calories * 0.20) / 9); // 9 cal/g fat
      } else {
        // Sedentary day macro split (25% protein, 45% carbs, 30% fat)
        metric.protein = Math.round((metric.calories * 0.25) / 4);
        metric.carbs = Math.round((metric.calories * 0.45) / 4);
        metric.fats = Math.round((metric.calories * 0.30) / 9);
      }
    }
    
    return metric;
  });
  
  // Keep days with any meaningful data (steps, calories, sleep, OR heart rate)
  return metrics.filter((m: any) => 
    m.steps > 0 || 
    m.calories > 0 || 
    m.totalSleepMinutes > 0 || 
    m.rhr !== null
  );
}
