'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { resign } from '@/lib/clients/core.socket.client';
import { Flag, LogOut } from 'lucide-react';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { getColorString } from '@/lib/utils/color.utils';

interface ResignButtonProps {
    gameId: string;
    color: MatchmakingColor;
    gameStarted?: boolean;
    onError?: (error: Error) => void;
    onClickMessage?: (message: string) => void;
}

function ResignButton({ gameId, color, gameStarted = true, onError, onClickMessage }: ResignButtonProps) {
    const { socket } = useCoreSocket();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isAbandoning = !gameStarted;
    const actionText = isAbandoning ? 'abandoned' : 'resigned';
    const dialogTitle = isAbandoning ? 'Abandon Game' : 'Resign Game';
    const dialogDescription = isAbandoning
        ? 'Are you sure you want to abandon the game?'
        : 'Are you sure you want to resign? This will end the game and count as a loss.';
    const tooltipText = isAbandoning ? 'Abandon the game' : 'Resign from the game';
    const confirmButtonText = isAbandoning ? 'Abandon' : 'Resign';

    const handleResign = async () => {
        if (!socket) {
            const error = new Error('Socket connection error');
            onError?.(error);
            return;
        }
        try {
            await resign(socket, gameId);
            onClickMessage?.(`${getColorString(color)} ${actionText}`);
            setIsDialogOpen(false);
        } catch (error) {
            if (error instanceof Error) {
                onError?.(error);
            }
        }
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        data-cy="game-control-button-resign"
                        className="w-full"
                    >
                        {isAbandoning ? <LogOut /> : <Flag />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{tooltipText}</TooltipContent>
            </Tooltip>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent data-cy="resign-confirmation-dialog">
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>{dialogDescription}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-cy="resign-cancel-button">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleResign} data-cy="resign-confirm-button">
                            {confirmButtonText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default ResignButton;
