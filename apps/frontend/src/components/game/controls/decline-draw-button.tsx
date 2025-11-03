'use client';

import { useState } from 'react';
import { useCoreSocket } from '@/hooks/chess/useCoreSocket';
import { respondDrawOffer } from '@/lib/clients/core.socket.client';
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
import { X } from 'lucide-react';

interface DeclineDrawButtonProps {
    gameId: string;
}

function DeclineDrawButton({ gameId }: DeclineDrawButtonProps) {
    const { socket } = useCoreSocket();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDeclineDraw = async () => {
        if (!socket) {
            return;
        }
        await respondDrawOffer(socket, gameId, false);
        setIsDialogOpen(false);
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        data-cy="game-control-button-decline-draw"
                        className="w-full"
                    >
                        <X />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Decline the draw offer</TooltipContent>
            </Tooltip>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent data-cy="decline-draw-confirmation-dialog">
                    <DialogHeader>
                        <DialogTitle>Decline Draw</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to decline the draw offer? The game will continue.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            data-cy="decline-draw-cancel-button"
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleDeclineDraw} data-cy="decline-draw-confirm-button">
                            Decline Draw
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default DeclineDrawButton;
