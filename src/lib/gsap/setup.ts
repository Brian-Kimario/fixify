/**
 * GSAP Setup
 * Register plugins globally so they're available in all components
 */

'use client';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default gsap;
