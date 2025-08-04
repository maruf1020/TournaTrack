
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
                Every great innovation begins with a simple question: "What if there's a better way?" For us, that question echoed through the halls during last year's annual sports tournament. The air was electric with excitement, but behind the scenes, a different kind of energy was buzzing—a controlled chaos fueled by passion, paperwork, and sheer willpower.
              </p>
              <p>
                The tournament was a monumental undertaking, managed heroically with pens, notepads, and an endless stream of phone calls. A dedicated team, including the incredible efforts of <b>Biggo, Azad, Nufaisa, Tanzim, Zunaid, Orpon,</b> and so many others, were the engine that kept it all running. They were the masters of the manual method, turning scattered sheets of paper into a cohesive and thrilling event. Brackets were drawn by hand, scores were yelled across rooms, and schedules were updated with a frantic scribble. It was a testament to their dedication that the tournament was such a resounding success.
              </p>
              <p>
                Yet, amidst the cheering crowds and victorious moments, we saw the toll this manual process took. We saw the late nights spent reconciling scores, the confusion from a misplaced registration form, and the immense pressure of keeping everything perfectly in sync. The spirit of the competition was alive and well, but the spirit of the organizers was being tested.
              </p>
              <p>
                That shared experience planted a seed. What if we could capture the passion and precision of that team and channel it into a tool? What if we could build something that would automate the tedious tasks, so future organizers could focus on what truly matters—the players and the games? We envisioned a platform that would honor the hard work of the past by making the future simpler, more efficient, and even more engaging.
              </p>
              <p>
                And so, <b>ELX-TournaTrack</b> was born. This application is not just a piece of software; it's a digital tribute to the team that made last year's tournament unforgettable. It’s built to handle everything from player registration and dynamic bracket generation to live score tracking, all in one seamless interface. Our goal was to eliminate the paperwork, not the passion.
              </p>
               <p>
                This project stands on the shoulders of those who managed the chaos with a smile. It’s a testament to the idea that the best solutions come from shared experiences, and that with a bit of inspiration and technology, we can empower our community to create even more memorable moments together. We dedicate this application to all their hard work.
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
                       <Mail size={14}/> marufbillah03033@gmail.com
                    </a>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
