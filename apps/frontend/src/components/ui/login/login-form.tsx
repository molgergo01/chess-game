import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import LoginButton from './login-button';

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid grid-rows-2 p-0 md:grid-cols-2">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">
                                    Welcome to Chess Game
                                </h1>
                                <p className="text-balance text-muted-foreground">
                                    Login to your Chess Game account
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative hidden bg-muted md:block row-span-2 aspect-square">
                        <Image
                            src="/board-login.png"
                            alt="An image of a chess board"
                            width={200}
                            height={200}
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4] dark:grayscale"
                        />
                    </div>

                    <div className="p-6 md:p-8 flex flex-col gap-6">
                        <div className="flex flex-col">
                            <LoginButton />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Partially created by shadcn/ui (https://ui.shadcn.com)
