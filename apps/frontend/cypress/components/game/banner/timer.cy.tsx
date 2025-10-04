import { TimeDisplay } from '@/components/game/banner/timer';

describe('<TimeDisplay />', () => {
    it('should render with formatted time', () => {
        cy.mount(<TimeDisplay timeLeft={600000} />);
        cy.contains('10:00').should('be.visible');
    });

    it('should display "10:00" for 10 minutes (600000ms)', () => {
        cy.mount(<TimeDisplay timeLeft={600000} />);
        cy.get('.text-2xl').should('have.text', '10:00');
    });

    it('should display "05:30" for 5:30 (330000ms)', () => {
        cy.mount(<TimeDisplay timeLeft={330000} />);
        cy.get('.text-2xl').should('have.text', '05:30');
    });

    it('should display "00:05" for 5 seconds (5000ms)', () => {
        cy.mount(<TimeDisplay timeLeft={5000} />);
        cy.get('.text-2xl').should('have.text', '00:05');
    });

    it('should display "00:00" for 0ms', () => {
        cy.mount(<TimeDisplay timeLeft={0} />);
        cy.get('.text-2xl').should('have.text', '00:00');
    });
});
