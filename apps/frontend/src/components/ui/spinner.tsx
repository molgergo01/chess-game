import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils/utils';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
    return (
        <Loader2Icon
            role="status"
            aria-label="Loading"
            data-cy="spinner"
            className={cn('size-4 animate-spin', className)}
            {...props}
        />
    );
}

export default Spinner;

// Partially created by shadcn/ui (https://ui.shadcn.com)
