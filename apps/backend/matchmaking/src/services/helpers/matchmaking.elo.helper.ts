import { EloRange, QueuedPlayer } from '../../models/matchmaking';

const MAX_ELO_RANGE = 800;
const TIME_RANGES = [
    { maxTime: 10, eloRange: 50 }, // 0-10s: ±50 ELO
    { maxTime: 20, eloRange: 100 }, // 10-20s: ±100 ELO
    { maxTime: 40, eloRange: 200 }, // 20-40: ±200 ELO
    { maxTime: 80, eloRange: 400 }, // 40-80: ±400 ELO
    { maxTime: 160, eloRange: 600 }, // 80-160: ±600 ELO
    { maxTime: Infinity, eloRange: MAX_ELO_RANGE } // 160s+: ±800 ELO
];

export function matchPlayersByElo(players: QueuedPlayer[]): [string, string][] {
    const currentTime = Date.now();

    const eloRangesByPlayers = new Map(
        players.map((player) => {
            const timeInQueueInSeconds = Math.round((currentTime - player.queueTimestamp) / 1000);
            const range = getEloRangeByTimeInQueue(player.elo, timeInQueueInSeconds);

            return [player, range];
        })
    );

    const matches: [string, string][] = [];
    const matched = new Set<string>();

    const validPairs: Array<{
        player1: QueuedPlayer;
        player2: QueuedPlayer;
        difference: number;
        maxWaitTime: number;
    }> = [];

    players.forEach((player1) => {
        const range1 = eloRangesByPlayers.get(player1)!;

        players.forEach((player2) => {
            if (player1 === player2) return;

            const range2 = eloRangesByPlayers.get(player2)!;

            if (
                player2.elo >= range1.minElo &&
                player2.elo <= range1.maxElo &&
                player1.elo >= range2.minElo &&
                player1.elo <= range2.maxElo
            ) {
                // Needed to avoid duplications
                if (player1.playerId < player2.playerId) {
                    validPairs.push({
                        player1,
                        player2,
                        difference: getEloDifference(player1, player2),
                        maxWaitTime: Math.max(
                            currentTime - player1.queueTimestamp,
                            currentTime - player2.queueTimestamp
                        )
                    });
                }
            }
        });
    });

    validPairs.sort((a, b) => {
        const eloComparison = a.difference - b.difference;
        if (eloComparison !== 0) return eloComparison;

        return b.maxWaitTime - a.maxWaitTime;
    });

    validPairs.forEach((pair) => {
        if (!matched.has(pair.player1.playerId) && !matched.has(pair.player2.playerId)) {
            matches.push([pair.player1.playerId, pair.player2.playerId]);
            matched.add(pair.player1.playerId);
            matched.add(pair.player2.playerId);
        }
    });

    return matches;
}

function getEloRangeByTimeInQueue(playerElo: number, timeInQueueInSeconds: number): EloRange {
    const range = TIME_RANGES.find((range) => timeInQueueInSeconds < range.maxTime)?.eloRange ?? MAX_ELO_RANGE;

    return {
        minElo: playerElo - range,
        maxElo: playerElo + range
    };
}

function getEloDifference(player1: QueuedPlayer, player2: QueuedPlayer) {
    return Math.abs(player1.elo - player2.elo);
}
