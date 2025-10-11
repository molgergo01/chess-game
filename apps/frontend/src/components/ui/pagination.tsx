'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import { HTMLAttributes } from 'react';

interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
    showPageNumbers?: boolean;
}

function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 2,
    showPageNumbers = true,
    className,
    ...props
}: PaginationProps) {
    const BUTTON_STYLE = 'md:h-9 md:px-4';
    const getPageRange = () => {
        const start = Math.max(1, currentPage - siblingCount);
        const end = Math.min(totalPages, currentPage + siblingCount);
        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className={cn('flex gap-1 md:gap-1', className)} {...props}>
            <Button
                size="sm"
                variant={currentPage === 1 ? 'secondary' : 'default'}
                className={BUTTON_STYLE}
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                data-cy="pagination-nav-first"
            >
                {'<<'}
            </Button>
            <Button
                size="sm"
                variant={currentPage === 1 ? 'secondary' : 'default'}
                className={BUTTON_STYLE}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                data-cy="pagination-nav-previous"
            >
                {'<'}
            </Button>
            {showPageNumbers &&
                getPageRange().map((page) => (
                    <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? 'outline' : 'default'}
                        className={BUTTON_STYLE}
                        onClick={() => onPageChange(page)}
                        disabled={currentPage === page}
                        data-cy={`pagination-nav-page-${page}`}
                    >
                        {page}
                    </Button>
                ))}
            <Button
                size="sm"
                variant={currentPage === totalPages ? 'secondary' : 'default'}
                className={BUTTON_STYLE}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                data-cy="pagination-nav-next"
            >
                {'>'}
            </Button>
            <Button
                size="sm"
                variant={currentPage === totalPages ? 'secondary' : 'default'}
                className={BUTTON_STYLE}
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                data-cy="pagination-nav-last"
            >
                {'>>'}
            </Button>
        </div>
    );
}

export default Pagination;
