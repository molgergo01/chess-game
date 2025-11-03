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
import { Check } from 'lucide-react';

interface AcceptDrawButtonProps {
    gameId: string;
}

function AcceptDrawButton({ gameId }: AcceptDrawButtonProps) {
    const { socket } = useCoreSocket();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAcceptDraw = async () => {
        if (!socket) {
            return;
        }
        await respondDrawOffer(socket, gameId, true);
        setIsDialogOpen(false);
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        data-cy="game-control-button-accept-draw"
                        className="w-full"
                    >
                        <Check />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Accept the draw offer</TooltipContent>
            </Tooltip>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent data-cy="accept-draw-confirmation-dialog">
                    <DialogHeader>
                        <DialogTitle>Accept Draw</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to accept the draw offer? This will end the game.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            data-cy="accept-draw-cancel-button"
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAcceptDraw} data-cy="accept-draw-confirm-button">
                            Accept Draw
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AcceptDrawButton;
