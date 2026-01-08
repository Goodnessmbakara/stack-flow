// index.ts  
// Week 3 Main Service: Automated Pool Management
// Runs cron jobs for analysis, rebalancing proposals, and monitoring

import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { PoolAnalyzer, PoolConfig } from './pool-analyzer.js';
import { RebalanceCalculator } from './rebalance-calculator.js';
import { logger } from './logger.js';

dotenv.config();

class PoolManagerService {
  private analyzer: PoolAnalyzer;
  private calculator: RebalanceCalculator;
  private app: express.Application;
  private poolConfigs: PoolConfig[] = [];

  constructor() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'stackflow';

    this.analyzer = new PoolAnalyzer(mongoUri, dbName);
    this.calculator = new RebalanceCalculator();
    this.app = express();

    this.setupRoutes();
    this.loadPoolConfigs();
  }

  /**
   * Load pool configurations
   */
  private loadPoolConfigs() {
    // In production, load from database or config file
    this.poolConfigs = [
      {
        poolId: '1',
        name: 'DeFi Whale Index',
        followedWhales: [
          'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9',
          'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
          'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335'
        ],
        whaleWeights: {
          'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9': 0.4,
          'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR': 0.3,
          'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335': 0.3
        },
        rebalanceThreshold: 0.10, // 10% drift
        contractAddress: process.env.POOL_CONTRACT_ADDRESS || 'SP...'
      }
    ];

    logger.info(`[PoolManager] Loaded ${this.poolConfigs.length} pool configurations`);
  }

  /**
   * Start the service
   */
  async start() {
    logger.info('[PoolManager] 🚀 Starting Pool Manager Service...');

    // Connect to MongoDB
    await this.analyzer.connect();

    // Schedule cron jobs
    this.scheduleCronJobs();

    // Start HTTP API
    const port = process.env.PORT || 5182;
    this.app.listen(port, () => {
      logger.info(`[PoolManager] 📡 API server listening on port ${port}`);
      logger.info(`[PoolManager] ✅ Service running. Press Ctrl+C to stop.`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('[PoolManager] 🛑 Shutting down gracefully...');
      await this.analyzer.disconnect();
      process.exit(0);
    });
  }

  /**
   * Schedule cron jobs for automated analysis
   */
  private scheduleCronJobs() {
    // Analyze pools every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      logger.info('[PoolManager] ⏰ Running scheduled pool analysis...');
      await this.analyzeAllPools();
    });

    // Health check every hour
    cron.schedule('0 * * * *', () => {
      logger.info('[PoolManager] ❤️ Health check - Service running normally');
    });

    logger.info('[PoolManager] ⏰ Cron jobs scheduled');
    logger.info('[PoolManager]    - Pool analysis: every 6 hours');
    logger.info('[PoolManager]    - Health check: every hour');

    // Run initial analysis
    setTimeout(() => this.analyzeAllPools(), 5000);
  }

  /**
   * Analyze all configured pools
   */
  private async analyzeAllPools() {
    try {
      for (const config of this.poolConfigs) {
        const analysis = await this.analyzer.analyzePool(config);

        if (analysis.needsRebalance) {
          logger.info(`[PoolManager] 🔔 Pool ${config.poolId} needs rebalancing!`);
          logger.info(`[PoolManager]    Drift: ${(analysis.driftPercentage * 100).toFixed(2)}%`);
          logger.info(`[PoolManager]    Threshold: ${(config.rebalanceThreshold * 100).toFixed(2)}%`);

          // Calculate swaps
          const swaps = this.calculator.calculateOptimalSwaps(
            analysis.currentAllocation,
            analysis.targetAllocation,
            analysis.poolTVL
          );

          // Validate swaps
          const validation = this.calculator.validateSwaps(swaps);
          if (!validation.valid) {
            logger.error(`[PoolManager] ❌ Invalid swaps for pool ${config.poolId}:`);
            validation.errors.forEach(err => logger.error(`  - ${err}`));
            continue;
          }

          logger.info(`[PoolManager] ✅ Generated ${swaps.length} valid swap instructions`);
          logger.info(`[PoolManager] 💰 Total cost: ${analysis.estimatedCost.totalCostPercent.toFixed(3)}% of pool`);

          // TODO: Create governance proposal
          // await this.createRebalanceProposal(config.poolId, swaps, analysis);
        } else {
          logger.info(`[PoolManager] ✓ Pool ${config.poolId} within threshold (${(analysis.driftPercentage * 100).toFixed(2)}%)`);
        }
      }
    } catch (error) {
      logger.error(`[PoolManager] ❌ Error during pool analysis: ${error}`);
    }
  }

  /**
   * Setup HTTP API routes
   */
  private setupRoutes() {
    this.app.use(express.json());

    // Health endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'pool-manager',
        timestamp: new Date().toISOString(),
        poolsConfigured: this.poolConfigs.length
      });
    });

    // Get all pools
    this.app.get('/api/pools', (req, res) => {
      res.json({
        pools: this.poolConfigs.map(c => ({
          poolId: c.poolId,
          name: c.name,
          followedWhales: c.followedWhales.length,
          threshold: c.rebalanceThreshold
        }))
      });
    });

    // Get pool analysis
    this.app.get('/api/pools/:id/analysis', async (req, res) => {
      try {
        const config = this.poolConfigs.find(c => c.poolId === req.params.id);
        if (!config) {
          return res.status(404).json({ error: 'Pool not found' });
        }

        const analysis = await this.analyzer.analyzePool(config);
        res.json(analysis);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Trigger manual rebalance analysis
    this.app.post('/api/pools/:id/analyze', async (req, res) => {
      try {
        const config = this.poolConfigs.find(c => c.poolId === req.params.id);
        if (!config) {
          return res.status(404).json({ error: 'Pool not found' });
        }

        const analysis = await this.analyzer.analyzePool(config);
        const swaps = this.calculator.calculateOptimalSwaps(
          analysis.currentAllocation,
          analysis.targetAllocation,
          analysis.poolTVL
        );

        res.json({
          analysis,
          swaps,
          validation: this.calculator.validateSwaps(swaps)
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    logger.info('[PoolManager] 📋 API routes configured');
  }
}

// Start service
const service = new PoolManagerService();
service.start().catch(error => {
  logger.error(`[PoolManager] ❌ Fatal error: ${error}`);
  process.exit(1);
});
