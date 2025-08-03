
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Linkedin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function StoryPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
        <Card className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="relative w-full aspect-[10/6] md:aspect-[10/4]">
              <Image
                src="https://scontent.fdac14-1.fna.fbcdn.net/v/t39.30808-6/476775370_1657442341877806_240361806365081696_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=aa7b47&_nc_eui2=AeFIr0L84M6F_ThrlblEeKUUO1mKLNhiVag7WYos2GJVqFgaCcMHJFIejmW4yb0NTnQPBsbkr5qhDZaN6MC14bU4&_nc_ohc=EZcMDlTB9D0Q7kNvwHoWAD0&_nc_oc=AdnLMW_aOs6YMEdKI-Ys_8MPyFom55hDFdsrHQKnqxwpNSIVJkXPFfI6qSszE2_t7YI&_nc_zt=23&_nc_ht=scontent.fdac14-1.fna&_nc_gid=ETVP9cauckh4tcTQDIUGCg&oh=00_AfT7ubVfg_yjKaF4g-JrAXYsLHYgL4ZhJOCAXvBVKf18Vg&oe=68944165"
                alt="Inspiration"
                layout="fill"
                objectFit="cover"
                data-ai-hint="team picture"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 -mt-12 relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-6">From Paper to Pixels: The Spark Behind TournaTrack</h1>

            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground space-y-6">
              <p>
                Last year, I was given the honor of managing the annual sports tournament for our Dhanmondi branch. It was an exciting responsibility, but one that quickly revealed its challenges. Armed with just a pen and a notepad, I dove headfirst into organizing what would become a whirlwind of logistics, schedules, and ever-changing brackets.
              </p>
              <p>
                The days were a blur of manual data entry, endless phone calls, and scribbled updates. Every player registration, every match score, and every schedule change had to be meticulously recorded by hand. The notepad became my constant companion, its pages filled with crossed-out names, revised timings, and complex webs of tournament brackets. It was a chaotic, yet passionate, effort to keep everything afloat.
              </p>
              <p>
                While the tournament itself was a great success, the process was incredibly demanding. I found myself spending countless hours at the office just to manage the tournament, which meant my actual development work had to be taken home. My days were spent on the tournament, and my nights were spent catching up on my core responsibilities. The line between work and personal life blurred, and I realized there had to be a better way.
              </p>
              <p>
                That experience planted a seed. As this year's tournament season approached, I was determined not to repeat the past. I envisioned a tool that could automate the tedious tasks, streamline communication, and bring the entire tournament management process into the digital age. I wanted to build something that would empower organizers, not overwhelm them.
              </p>
              <p>
                And so, **ELX-TournaTrack** was born. This application is the direct result of that challenging but invaluable experience. It’s built to handle everything from player registration to live score tracking and dynamic bracket generation, all in one place. My goal was to create a solution that would allow organizers to focus on the spirit of the competition, rather than getting lost in the paperwork.
              </p>
              <p>
                This project is more than just code; it's a testament to the idea that with a bit of inspiration and technology, we can solve our own problems and make our work—and our passions—more enjoyable and efficient.
              </p>
            </div>

            <div className="mt-12 border-t pt-6 flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://avatars.githubusercontent.com/u/152874914?v=4" alt="MARUF BILLAH" data-ai-hint="profile person" />
                <AvatarFallback>MB</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <Link href="https://www.linkedin.com/in/marufbillah1020" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary flex items-center gap-2">
                  MARUF BILLAH
                </Link>
                <a href="mailto:marufbillah03033@gmail.com" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                  <Mail size={14} /> marufbillah03033@gmail.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
