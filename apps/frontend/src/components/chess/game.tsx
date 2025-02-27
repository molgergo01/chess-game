'use client';

import { Chessboard } from 'react-chessboard';

export default function Game({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div className={className} {...props}>
            <Chessboard />
        </div>
    );
}
