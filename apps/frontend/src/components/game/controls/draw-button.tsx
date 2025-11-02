'use client';

import { useState } from 'react';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { offerDraw } from '@/lib/clients/core.socket.client';
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
import { Handshake } from 'lucide-react';
import { MatchmakingColor } from '@/lib/models/request/matchmaking';
import { getColorString } from '@/lib/utils/color.utils';

interface DrawButtonProps {
    gameId: string;
    color: MatchmakingColor;
    disabled: boolean;
    gameStarted?: boolean;
    onError?: (error: Error) => void;
    onClickMessage?: (message: string) => void;
}

function DrawButton({ gameId, color, disabled, gameStarted = true, onError, onClickMessage }: DrawButtonProps) {
    const { socket } = useCoreSocket();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isDisabled = disabled || !gameStarted;
    const tooltipText = !gameStarted ? 'Wait for the game to start' : 'Offer a draw to your opponent';

    const handleOfferDraw = async () => {
        if (!socket) {
            const error = new Error('Socket connection error');
            onError?.(error);
            return;
        }
        try {
            await offerDraw(socket, gameId);
            onClickMessage?.(`${getColorString(color)} offered a draw`);
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
                        disabled={isDisabled}
                        onClick={() => setIsDialogOpen(true)}
                        data-cy="game-control-button-draw"
                        className="w-full"
                    >
                        <Handshake />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{tooltipText}</TooltipContent>
            </Tooltip>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent data-cy="draw-confirmation-dialog">
                    <DialogHeader>
                        <DialogTitle>Offer Draw</DialogTitle>
                        <DialogDescription>Are you sure you want to offer a draw to your opponent?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-cy="draw-cancel-button">
                            Cancel
                        </Button>
                        <Button onClick={handleOfferDraw} data-cy="draw-confirm-button">
                            Offer Draw
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default DrawButton;
