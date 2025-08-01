// This is a customized version of the next-top-loader library,
// adapted for this project to be a client component.
'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const
    DEFAULT_COLOR = '#29d',
    DEFAULT_HEIGHT = 3,
    DEFAULT_SHOW_SPINNER = true,
    DEFAULT_CRAWL = true,
    DEFAULT_CRAWL_SPEED = 200,
    DEFAULT_INITIAL_POSITION = 0.08,
    DEFAULT_EASING = 'ease',
    DEFAULT_SPEED = 200,
    DEFAULT_SHADOW = '0 0 10px #29d, 0 0 5px #29d';

const isBrowser = typeof window !== 'undefined';

// NProgress object adapted for this component.
const NProgress = {
    settings: {
        minimum: 0.08,
        easing: 'linear',
        positionUsing: '',
        speed: 300,
        trickle: true,
        trickleSpeed: 300,
        showSpinner: true,
        barSelector: '[role="bar"]',
        spinnerSelector: '[role="spinner"]',
        parent: 'body',
        template: '',
    },
    version: '0.2.0',
    status: null as number | null,
    
    configure: function (options: Partial<typeof NProgress.settings>) {
        for (const key in options) {
            const value = options[key as keyof typeof options];
            if (value !== undefined && options.hasOwnProperty(key)) {
                (NProgress.settings as any)[key] = value;
            }
        }
        return this;
    },

    set: function (n: number) {
        const started = this.isStarted();
        n = clamp(n, this.settings.minimum, 1);
        this.status = (n === 1 ? null : n);

        const progress = this.render(!started);
        const bar = progress.querySelector<HTMLElement>(this.settings.barSelector);
        if (bar) {
            bar.style.transform = 'translate3d(' + toBarPerc(n) + '%,0,0)';
            bar.style.transition = 'transform ' + this.settings.speed + 'ms ' + this.settings.easing;
        }
        
        if (n === 1) {
            progress.style.opacity = '0';
            progress.style.transition = 'opacity ' + this.settings.speed + 'ms';
            setTimeout(() => {
                this.remove();
            }, this.settings.speed);
        } else {
             setTimeout(() => {
                progress.style.opacity = '1';
                progress.style.transition = 'opacity ' + this.settings.speed + 'ms';
            }, 0);
        }
        return this;
    },
    isStarted: function () {
        return typeof this.status === 'number';
    },
    start: function () {
        if (!this.status) this.set(this.settings.minimum);
        
        const work = () => {
            setTimeout(() => {
                if (!this.status) return;
                this.trickle();
                work();
            }, this.settings.trickleSpeed);
        };
        if (this.settings.trickle) work();

        return this;
    },
    done: function () {
        if (!this.status) return this;
        return this.inc(0.3 + 0.5 * Math.random()).set(1);
    },
    inc: function (amount?: number) {
        let n = this.status;
        if (!n) {
            return this.start();
        } 
        if (typeof amount !== 'number') {
            amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
        }
        n = clamp(n + amount, 0, 0.994);
        return this.set(n);
    },
    trickle: function () {
        return this.inc();
    },
    render: function (fromStart: boolean) {
        if (this.isRendered()) return document.getElementById('nprogress')!;
        
        const progress = document.createElement('div');
        progress.id = 'nprogress';
        progress.innerHTML = this.settings.template;

        const bar = progress.querySelector<HTMLElement>(this.settings.barSelector);
        if (bar) {
             bar.style.position = 'fixed';
             bar.style.zIndex = '1031';
             bar.style.top = '0';
             bar.style.left = '0';
             bar.style.width = '100%';
             bar.style.height = '3px'; // Use provided height
             bar.style.opacity = fromStart ? '0' : '1';
        }
        
        const parent = document.querySelector(this.settings.parent);
        if (parent) {
            parent.appendChild(progress);
        }
        return progress;
    },
    isRendered: function () {
        return !!document.getElementById('nprogress');
    },
    remove: function () {
        const progress = document.getElementById('nprogress');
        if (progress) {
            progress.parentNode?.removeChild(progress);
        }
    }
};

interface NextTopLoaderProps {
    color?: string;
    height?: number;
    showSpinner?: boolean;
    crawl?: boolean;
    crawlSpeed?: number;
    initialPosition?: number;
    easing?: string;
    speed?: number;
    shadow?: string | false;
    template?: string;
    zIndex?: number;
    showAtBottom?: boolean;
}

export const NextTopLoader: React.FC<NextTopLoaderProps> = ({
    color = DEFAULT_COLOR,
    height = DEFAULT_HEIGHT,
    showSpinner = DEFAULT_SHOW_SPINNER,
    crawl = DEFAULT_CRAWL,
    crawlSpeed = DEFAULT_CRAWL_SPEED,
    initialPosition = DEFAULT_INITIAL_POSITION,
    easing = DEFAULT_EASING,
    speed = DEFAULT_SPEED,
    shadow = DEFAULT_SHADOW,
    template,
    zIndex = 1600,
    showAtBottom = false,
}) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        NProgress.configure({
            minimum: initialPosition,
            easing: easing,
            speed: speed,
            showSpinner: showSpinner,
            trickle: crawl,
            trickleSpeed: crawlSpeed,
            template: template || `<div class="bar" role="bar" style="z-index: ${zIndex}"><div class="peg"></div></div>`,
        });

        const handleAnchorClick = (event: MouseEvent) => {
            try {
                const anchor = event.currentTarget as HTMLAnchorElement;
                const url = new URL(anchor.href);
                const isExternal = anchor.target === '_blank';
                const isSameOrigin = window.location.origin === url.origin;
                const isSamePath = window.location.pathname === url.pathname;
                const isSameSearch = window.location.search === url.search;

                if (isExternal || !isSameOrigin || (isSamePath && isSameSearch)) {
                    // Don't show loader for external links or if it's the exact same URL
                    if(isSamePath && isSameSearch) NProgress.done();
                    return;
                }
                NProgress.start();
            } catch (err) {
                 // Fallback for invalid URLs
                 NProgress.start();
            }
        };

        const handleMutation: MutationCallback = () => {
            const anchors = document.querySelectorAll('a');
            anchors.forEach((anchor) => anchor.addEventListener('click', handleAnchorClick));
        };
        
        const mutationObserver = new MutationObserver(handleMutation);
        if (isBrowser) {
             mutationObserver.observe(document, { childList: true, subtree: true });
        }


        // Add a style tag to the head
        const style = document.createElement('style');
        style.id = 'nprogress-style';
        style.innerHTML = `
            #nprogress {
                pointer-events: none;
            }
            #nprogress .bar {
                background: ${color};
                position: fixed;
                z-index: ${zIndex};
                top: 3.5rem; /* Position under the header (h-14) */
                left: 0;
                width: 100%;
                height: ${height}px;
            }
            #nprogress .peg {
                display: none; /* Hide the peg */
            }
        `;

        // Remove old style if it exists
        const oldStyle = document.getElementById('nprogress-style');
        if(oldStyle) {
            document.head.removeChild(oldStyle);
        }
        document.head.appendChild(style);

        return () => {
            mutationObserver.disconnect();
            document.querySelectorAll('a').forEach((anchor) => anchor.removeEventListener('click', handleAnchorClick));
             if (style.parentNode) {
                document.head.removeChild(style);
            }
        };
    }, [color, height, showSpinner, crawl, crawlSpeed, initialPosition, easing, speed, shadow, template, zIndex, showAtBottom]);

    React.useEffect(() => {
        NProgress.done();
    }, [pathname, searchParams]);

    return null;
};


function clamp(n: number, min: number, max: number) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
}

function toBarPerc(n: number) {
    return (-1 + n) * 100;
}

    