import HistoryDetails from '@/components/history/history-details';
import { Color, Move } from '@/lib/models/history/history';

describe('<HistoryDetails />', () => {
    const mockMoves: Move[] = [
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
        },
        {
            moveNumber: 2,
            playerColor: Color.WHITE,
            moveNotation: 'Nf3',
            positionFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
            whitePlayerTime: 285000,
            blackPlayerTime: 290000
        }
    ];

    it('should render with initial position and move history', () => {
        const onMoveSelect = cy.stub();

        cy.mount(<HistoryDetails moves={mockMoves} currentMoveIndex={-1} onMoveSelect={onMoveSelect} />);

        cy.getDataCy('history-details').should('be.visible');
        cy.getDataCy('history-initial-position').should('be.visible').should('contain', 'Starting Position');
        cy.getDataCy('history-move-pair-1').should('be.visible');
    });

    it('should render move pairs correctly', () => {
        const onMoveSelect = cy.stub();

        cy.mount(<HistoryDetails moves={mockMoves} currentMoveIndex={0} onMoveSelect={onMoveSelect} />);

        cy.getDataCy('history-move-white-1').should('be.visible').should('contain', 'e4');
        cy.getDataCy('history-move-black-1').should('be.visible').should('contain', 'e5');
        cy.getDataCy('history-move-white-2').should('be.visible').should('contain', 'Nf3');
    });

    it('should call onMoveSelect when clicking initial position', () => {
        const onMoveSelect = cy.stub();

        cy.mount(<HistoryDetails moves={mockMoves} currentMoveIndex={0} onMoveSelect={onMoveSelect} />);

        cy.getDataCy('history-initial-position').click();

        cy.wrap(onMoveSelect).should('have.been.calledWith', -1);
    });

    it('should call onMoveSelect when clicking a move', () => {
        const onMoveSelect = cy.stub();

        cy.mount(<HistoryDetails moves={mockMoves} currentMoveIndex={-1} onMoveSelect={onMoveSelect} />);

        cy.getDataCy('history-move-white-1').click();

        cy.wrap(onMoveSelect).should('have.been.calledWith', 0);
    });

    it('should render pagination', () => {
        const onMoveSelect = cy.stub();

        cy.mount(<HistoryDetails moves={mockMoves} currentMoveIndex={0} onMoveSelect={onMoveSelect} />);

        cy.getDataCy('history-pagination').should('be.visible');
    });

    it('should highlight current move', () => {
        const onMoveSelect = cy.stub();

        cy.mount(<HistoryDetails moves={mockMoves} currentMoveIndex={0} onMoveSelect={onMoveSelect} />);

        cy.getDataCy('history-move-white-1').should('have.class', 'bg-primary');
    });

    it('should highlight initial position when currentMoveIndex is -1', () => {
        const onMoveSelect = cy.stub();

        cy.mount(<HistoryDetails moves={mockMoves} currentMoveIndex={-1} onMoveSelect={onMoveSelect} />);

        cy.getDataCy('history-initial-position').should('have.class', 'bg-primary');
    });
});
