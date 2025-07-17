// import redis from 'chess-game-backend-common/config/redis';
//
// class DistributedGameTimer {
//     private readonly gameId;
//     private readonly localInterval;
//
//     constructor(gameId) {
//         this.gameId = gameId;
//         this.localInterval = null;
//     }
//
//     async startTurn(playerId, duration = 30000) {
//         const timerKey = `game:${this.gameId}:timer`;
//         const now = Date.now();
//
//         // Store timer state in Redis
//         await redis.hset(timerKey, {
//             playerId,
//             startTime: now,
//             duration,
//             active: 1
//         });
//
//         await redis.expire(timerKey, Math.ceil(duration / 1000) + 5); // Auto-cleanup
//
//         // Start local monitoring
//         this.startLocalMonitoring();
//
//         // Broadcast to all replicas
//         await redis.publish(
//             `game:${this.gameId}:events`,
//             JSON.stringify({
//                 type: 'turn-started',
//                 playerId,
//                 duration,
//                 startTime: now
//             })
//         );
//     }
//
//     async getRemainingTime() {
//         const timerKey = `game:${this.gameId}:timer`;
//         const timerData = await redis.hgetall(timerKey);
//
//         if (!timerData.active) return 0;
//
//         const elapsed = Date.now() - parseInt(timerData.startTime);
//         const remaining = Math.max(0, parseInt(timerData.duration) - elapsed);
//
//         return remaining;
//     }
//
//     startLocalMonitoring() {
//         this.stopLocalMonitoring();
//
//         this.localInterval = setInterval(async () => {
//             const remaining = await this.getRemainingTime();
//
//             // Broadcast time updates
//             io.to(this.gameId).emit('time-update', {
//                 playerId: await this.getCurrentPlayer(),
//                 timeRemaining: remaining
//             });
//
//             // Check if time expired
//             if (remaining <= 0) {
//                 await this.handleTimeUp();
//             }
//         }, 1000);
//     }
//
//     async handleTimeUp() {
//         const timerKey = `game:${this.gameId}:timer`;
//         const lockKey = `game:${this.gameId}:timer:lock`;
//
//         // Use Redis lock to ensure only one replica handles timeout
//         const lock = await this.redis.set(lockKey, '1', 'PX', 1000, 'NX');
//
//         if (lock) {
//             const playerId = await this.getCurrentPlayer();
//
//             // Clear timer
//             await redis.del(timerKey);
//
//             // Broadcast timeout event
//             await redis.publish(
//                 `game:${this.gameId}:events`,
//                 JSON.stringify({
//                     type: 'time-up',
//                     playerId
//                 })
//             );
//
//             this.stopLocalMonitoring();
//         }
//     }
// }
