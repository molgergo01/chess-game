import GameHistory from '@/components/history/game-history';
import { Color, GameWithMoves, Winner } from '@/lib/models/history/history';

describe('<GameHistory />', () => {
    const mockGame: GameWithMoves = {
        gameId: 'test-game-123',
        whitePlayer: {
            userId: 'white-player-123',
            name: 'Magnus Carlsen',
            elo: 2850
        },
        blackPlayer: {
            userId: 'black-player-456',
            name: 'Hikaru Nakamura',
            elo: 2800
        },
        startedAt: new Date('2025-01-15T10:00:00Z'),
        winner: Winner.WHITE,
        moves: [
            {
                moveNumber: 1,
                playerColor: Color.WHITE,
                moveNotation: 'e4',
                positionFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
                whitePlayerTime: 295000,
                blackPlayerTime: 300000
            },
            {
                moveNumber: 1,
                playerColor: Color.BLACK,
                moveNotation: 'e5',
                positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
                whitePlayerTime: 295000,
                blackPlayerTime: 290000
            }
        ]
    };

    it('should render game history container', () => {
        cy.mount(<GameHistory game={mockGame} />);

        cy.getDataCy('game-history-container').should('be.visible');
    });

    it('should render chessboard container', () => {
        cy.mount(<GameHistory game={mockGame} />);

        cy.getDataCy('game-chessboard-container').should('be.visible');
    });

    it('should render history details', () => {
        cy.mount(<GameHistory game={mockGame} />);

        cy.getDataCy('game-history-details').should('be.visible');
    });

    it('should render with correct player information', () => {
        cy.mount(<GameHistory game={mockGame} />);

        cy.contains('Magnus Carlsen').should('exist');
        cy.contains('Hikaru Nakamura').should('exist');
    });
});
