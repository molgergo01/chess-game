import ClientOnlyChessboard from '@/components/ui/client-only-chessboard';

describe('<ClientOnlyChessboard />', () => {
    it('should render chessboard after mount', () => {
        cy.mount(<ClientOnlyChessboard options={{}} />);

        cy.getDataCy('client-only-chessboard').should('be.visible');
    });
});
