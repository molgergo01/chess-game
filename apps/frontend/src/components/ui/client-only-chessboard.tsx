'use client';

import { Chessboard, ChessboardOptions } from 'react-chessboard';
import { useEffect, useState } from 'react';
import Spinner from '@/components/ui/spinner';

interface ClientOnlyChessboardProps {
    options: ChessboardOptions;
}

function ClientOnlyChessboard({ options }: ClientOnlyChessboardProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div
                className="w-full h-full bg-muted/20 flex items-center justify-center rounded-lg"
                data-cy="client-only-chessboard-loading"
            >
                <Spinner className="size-14" />
            </div>
        );
    }

    return (
        <div data-cy="client-only-chessboard">
            <Chessboard options={options} />
        </div>
    );
}

export default ClientOnlyChessboard;
