import Pagination from '@/components/ui/pagination';

describe('<Pagination />', () => {
    it('should render all navigation buttons', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={1} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-first').should('be.visible');
        cy.getDataCy('pagination-nav-previous').should('be.visible');
        cy.getDataCy('pagination-nav-next').should('be.visible');
        cy.getDataCy('pagination-nav-last').should('be.visible');
    });

    it('should render page number buttons', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-page-3').should('be.visible');
        cy.getDataCy('pagination-nav-page-4').should('be.visible');
        cy.getDataCy('pagination-nav-page-5').should('be.visible');
        cy.getDataCy('pagination-nav-page-6').should('be.visible');
        cy.getDataCy('pagination-nav-page-7').should('be.visible');
    });

    it('should disable first and previous buttons on first page', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={1} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-first').should('be.disabled');
        cy.getDataCy('pagination-nav-previous').should('be.disabled');
        cy.getDataCy('pagination-nav-next').should('not.be.disabled');
        cy.getDataCy('pagination-nav-last').should('not.be.disabled');
    });

    it('should disable next and last buttons on last page', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={10} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-first').should('not.be.disabled');
        cy.getDataCy('pagination-nav-previous').should('not.be.disabled');
        cy.getDataCy('pagination-nav-next').should('be.disabled');
        cy.getDataCy('pagination-nav-last').should('be.disabled');
    });

    it('should enable all navigation buttons on middle page', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-first').should('not.be.disabled');
        cy.getDataCy('pagination-nav-previous').should('not.be.disabled');
        cy.getDataCy('pagination-nav-next').should('not.be.disabled');
        cy.getDataCy('pagination-nav-last').should('not.be.disabled');
    });

    it('should call onPageChange with 1 when first button is clicked', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-first').click();

        cy.wrap(onPageChange).should('have.been.calledWith', 1);
    });

    it('should call onPageChange with previous page when previous button is clicked', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-previous').click();

        cy.wrap(onPageChange).should('have.been.calledWith', 4);
    });

    it('should call onPageChange with next page when next button is clicked', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-next').click();

        cy.wrap(onPageChange).should('have.been.calledWith', 6);
    });

    it('should call onPageChange with totalPages when last button is clicked', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-last').click();

        cy.wrap(onPageChange).should('have.been.calledWith', 10);
    });

    it('should call onPageChange with page number when page button is clicked', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-page-7').click();

        cy.wrap(onPageChange).should('have.been.calledWith', 7);
    });

    it('should disable current page button', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-page-5').should('be.disabled');
        cy.getDataCy('pagination-nav-page-4').should('not.be.disabled');
        cy.getDataCy('pagination-nav-page-6').should('not.be.disabled');
    });

    it('should render correct page range with default siblingCount', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-page-3').should('be.visible');
        cy.getDataCy('pagination-nav-page-4').should('be.visible');
        cy.getDataCy('pagination-nav-page-5').should('be.visible');
        cy.getDataCy('pagination-nav-page-6').should('be.visible');
        cy.getDataCy('pagination-nav-page-7').should('be.visible');
        cy.getDataCy('pagination-nav-page-2').should('not.exist');
        cy.getDataCy('pagination-nav-page-8').should('not.exist');
    });

    it('should render correct page range with siblingCount=1', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} siblingCount={1} />);

        cy.getDataCy('pagination-nav-page-4').should('be.visible');
        cy.getDataCy('pagination-nav-page-5').should('be.visible');
        cy.getDataCy('pagination-nav-page-6').should('be.visible');
        cy.getDataCy('pagination-nav-page-3').should('not.exist');
        cy.getDataCy('pagination-nav-page-7').should('not.exist');
    });

    it('should render correct page range with siblingCount=3', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} siblingCount={3} />);

        cy.getDataCy('pagination-nav-page-2').should('be.visible');
        cy.getDataCy('pagination-nav-page-3').should('be.visible');
        cy.getDataCy('pagination-nav-page-4').should('be.visible');
        cy.getDataCy('pagination-nav-page-5').should('be.visible');
        cy.getDataCy('pagination-nav-page-6').should('be.visible');
        cy.getDataCy('pagination-nav-page-7').should('be.visible');
        cy.getDataCy('pagination-nav-page-8').should('be.visible');
        cy.getDataCy('pagination-nav-page-1').should('not.exist');
        cy.getDataCy('pagination-nav-page-9').should('not.exist');
    });

    it('should not exceed page 1 when calculating page range', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={2} totalPages={10} onPageChange={onPageChange} siblingCount={2} />);

        cy.getDataCy('pagination-nav-page-1').should('be.visible');
        cy.getDataCy('pagination-nav-page-2').should('be.visible');
        cy.getDataCy('pagination-nav-page-3').should('be.visible');
        cy.getDataCy('pagination-nav-page-4').should('be.visible');
    });

    it('should not exceed totalPages when calculating page range', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={9} totalPages={10} onPageChange={onPageChange} siblingCount={2} />);

        cy.getDataCy('pagination-nav-page-7').should('be.visible');
        cy.getDataCy('pagination-nav-page-8').should('be.visible');
        cy.getDataCy('pagination-nav-page-9').should('be.visible');
        cy.getDataCy('pagination-nav-page-10').should('be.visible');
    });

    it('should hide page numbers when showPageNumbers is false', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} showPageNumbers={false} />);

        cy.getDataCy('pagination-nav-first').should('be.visible');
        cy.getDataCy('pagination-nav-previous').should('be.visible');
        cy.getDataCy('pagination-nav-next').should('be.visible');
        cy.getDataCy('pagination-nav-last').should('be.visible');
        cy.getDataCy('pagination-nav-page-5').should('not.exist');
        cy.getDataCy('pagination-nav-page-4').should('not.exist');
        cy.getDataCy('pagination-nav-page-6').should('not.exist');
    });

    it('should handle single page correctly', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={1} totalPages={1} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-first').should('be.disabled');
        cy.getDataCy('pagination-nav-previous').should('be.disabled');
        cy.getDataCy('pagination-nav-next').should('be.disabled');
        cy.getDataCy('pagination-nav-last').should('be.disabled');
        cy.getDataCy('pagination-nav-page-1').should('be.visible').should('be.disabled');
    });

    it('should handle two pages correctly', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={1} totalPages={2} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-page-1').should('be.visible');
        cy.getDataCy('pagination-nav-page-2').should('be.visible');
        cy.getDataCy('pagination-nav-page-3').should('not.exist');
    });

    it('should render navigation buttons with correct text content', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-first').should('contain.text', '<<');
        cy.getDataCy('pagination-nav-previous').should('contain.text', '<');
        cy.getDataCy('pagination-nav-next').should('contain.text', '>');
        cy.getDataCy('pagination-nav-last').should('contain.text', '>>');
    });

    it('should render page number buttons with correct text content', () => {
        const onPageChange = cy.stub();
        cy.mount(<Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        cy.getDataCy('pagination-nav-page-3').should('contain.text', '3');
        cy.getDataCy('pagination-nav-page-4').should('contain.text', '4');
        cy.getDataCy('pagination-nav-page-5').should('contain.text', '5');
        cy.getDataCy('pagination-nav-page-6').should('contain.text', '6');
        cy.getDataCy('pagination-nav-page-7').should('contain.text', '7');
    });
});
