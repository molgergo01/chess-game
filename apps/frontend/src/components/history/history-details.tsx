'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/utils';
import { Color, Move } from '@/lib/models/history/history';
import Pagination from '@/components/ui/pagination';
import { formatTime } from '@/lib/utils/time.utils';

interface HistoryDetailsProps extends React.ComponentProps<'div'> {
    moves: Move[];
    currentMoveIndex: number;
    onMoveSelect: (index: number) => void;
}

interface MovePair {
    moveNumber: number;
    whiteMove: Move | null;
    blackMove: Move | null;
}

function HistoryDetails({ className, moves, currentMoveIndex, onMoveSelect, ...props }: HistoryDetailsProps) {
    const selectedMoveRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        selectedMoveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [currentMoveIndex]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                if (currentMoveIndex > -1) {
                    onMoveSelect(currentMoveIndex - 1);
                }
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                if (currentMoveIndex < moves.length - 1) {
                    onMoveSelect(currentMoveIndex + 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentMoveIndex, moves.length, onMoveSelect]);

    const movePairs: MovePair[] = [];
    moves.forEach((move) => {
        const pairIndex = move.moveNumber - 1;
        if (!movePairs[pairIndex]) {
            movePairs[pairIndex] = {
                moveNumber: move.moveNumber,
                whiteMove: null,
                blackMove: null
            };
        }
        if (move.playerColor === Color.WHITE) {
            movePairs[pairIndex].whiteMove = move;
        } else {
            movePairs[pairIndex].blackMove = move;
        }
    });

    const getMoveGlobalIndex = (moveNumber: number, color: Color): number => {
        return moves.findIndex((m) => m.moveNumber === moveNumber && m.playerColor === color);
    };

    const getTimeSpent = (time: number, previousTime: number) => {
        return formatTime(previousTime - time);
    };

    return (
        <div
            className={cn('flex flex-col rounded-lg border bg-background shadow-md p-2 h-full', className)}
            data-cy="history-details"
            {...props}
        >
            <div className="flex-shrink-0 p-2 border-b">
                <h3 className="text-lg font-semibold">Move History</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
                <div className="space-y-1">
                    <div
                        ref={currentMoveIndex === -1 ? selectedMoveRef : null}
                        className={cn(
                            'p-2 rounded cursor-pointer hover:bg-muted transition-colors',
                            currentMoveIndex === -1 ? 'bg-primary text-primary-foreground hover:bg-primary' : ''
                        )}
                        onClick={() => onMoveSelect(-1)}
                        data-cy="history-initial-position"
                    >
                        <span className="font-semibold text-sm">Starting Position</span>
                    </div>
                    {movePairs.map((pair) => (
                        <div
                            key={pair.moveNumber}
                            className="grid grid-cols-[auto_1fr_1fr] gap-2 p-1"
                            data-cy={`history-move-pair-${pair.moveNumber}`}
                        >
                            <div className="flex items-center justify-center text-sm font-semibold text-muted-foreground min-w-[2rem]">
                                {pair.moveNumber}.
                            </div>
                            {pair.whiteMove && (
                                <div
                                    ref={
                                        currentMoveIndex === getMoveGlobalIndex(pair.moveNumber, Color.WHITE)
                                            ? selectedMoveRef
                                            : null
                                    }
                                    className={cn(
                                        'p-2 rounded cursor-pointer hover:bg-muted transition-colors',
                                        currentMoveIndex === getMoveGlobalIndex(pair.moveNumber, Color.WHITE)
                                            ? 'bg-primary text-primary-foreground hover:bg-primary'
                                            : ''
                                    )}
                                    onClick={() => onMoveSelect(getMoveGlobalIndex(pair.moveNumber, Color.WHITE))}
                                    data-cy={`history-move-white-${pair.moveNumber}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{pair.whiteMove.moveNotation}</span>
                                        <span className="text-xs opacity-70">
                                            {pair.moveNumber != 1 &&
                                                getTimeSpent(
                                                    pair.whiteMove.whitePlayerTime,
                                                    moves[getMoveGlobalIndex(pair.moveNumber, Color.WHITE) - 1]
                                                        .whitePlayerTime
                                                )}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {!pair.whiteMove && <div />}
                            {pair.blackMove && (
                                <div
                                    ref={
                                        currentMoveIndex === getMoveGlobalIndex(pair.moveNumber, Color.BLACK)
                                            ? selectedMoveRef
                                            : null
                                    }
                                    className={cn(
                                        'p-2 rounded cursor-pointer hover:bg-muted transition-colors',
                                        currentMoveIndex === getMoveGlobalIndex(pair.moveNumber, Color.BLACK)
                                            ? 'bg-primary text-primary-foreground hover:bg-primary'
                                            : ''
                                    )}
                                    onClick={() => onMoveSelect(getMoveGlobalIndex(pair.moveNumber, Color.BLACK))}
                                    data-cy={`history-move-black-${pair.moveNumber}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">{pair.blackMove.moveNotation}</span>
                                        <span className="text-xs opacity-70">
                                            {getTimeSpent(
                                                pair.blackMove.blackPlayerTime,
                                                moves[getMoveGlobalIndex(pair.moveNumber, Color.BLACK) - 1]
                                                    .blackPlayerTime
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {!pair.blackMove && <div />}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-shrink-0 p-2 border-t">
                <Pagination
                    currentPage={currentMoveIndex + 2}
                    totalPages={moves.length + 1}
                    onPageChange={(page) => onMoveSelect(page - 2)}
                    showPageNumbers={false}
                    className="justify-center"
                    data-cy="history-pagination"
                />
            </div>
        </div>
    );
}

export default HistoryDetails;
